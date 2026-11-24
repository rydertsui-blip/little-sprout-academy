import json
import os
import re
from datetime import datetime
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = os.getenv("BASE_URL", "http://127.0.0.1:4186/family/")
SHOTS = Path("work/family-audit/redesign")
SHOTS.mkdir(parents=True, exist_ok=True)
checks = []
errors = []


def tap(page, locator):
    locator.wait_for(state="visible")
    locator.scroll_into_view_if_needed()
    locator.tap(timeout=10000)


def assert_layout(page, label):
    overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    assert overflow <= 1, f"{label}: horizontal overflow {overflow}px"
    small_targets = page.evaluate("""
      [...document.querySelectorAll('button, summary')]
        .filter((el) => {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && (rect.width < 40 || rect.height < 40);
        })
        .map((el) => ({ tag: el.tagName, text: el.textContent.trim().slice(0, 40), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }))
    """)
    assert not small_targets, f"{label}: touch targets below 40px: {small_targets}"
    checks.append(f"{label}: layout clean")


def shot(page, name):
    page.wait_for_timeout(260)
    page.screenshot(path=str(SHOTS / name), full_page=True)
    checks.append(f"shot {name}")


def setup_family(page):
    tap(page, page.get_by_label("家庭名称"))
    page.get_by_label("家庭名称").fill("我们的学习区")
    tap(page, page.get_by_label("家长称呼"))
    page.get_by_label("家长称呼").fill("妈妈")
    tap(page, page.get_by_label("家长密码"))
    page.get_by_label("家长密码").fill("2468")
    tap(page, page.get_by_role("button", name="建立家庭学习区"))
    page.wait_for_selector("text=今天谁来学习？")


def open_parent(page):
    tap(page, page.get_by_role("button", name=re.compile("家长设置|Parent settings")))
    page.wait_for_selector("text=进入家长设置")
    tap(page, page.get_by_label("家长密码确认"))
    page.get_by_label("家长密码确认").fill("2468")
    tap(page, page.get_by_role("button", name="进入设置"))
    page.wait_for_selector("text=孩子学习情况")


def add_first_child(page):
    tap(page, page.get_by_role("button", name="添加第一个孩子"))
    tap(page, page.get_by_label("孩子的名字"))
    page.get_by_label("孩子的名字").fill("小年")
    assert page.get_by_label("孩子年龄").input_value() == "6"
    assert page.get_by_label("在读年级").input_value() == "P1"
    tap(page, page.get_by_role("button", name="星星头像"))
    tap(page, page.get_by_role("button", name="保存档案"))
    page.get_by_role("heading", name="小年").wait_for(state="visible")


def export_due_backup(page):
    tap(page, page.locator(".data-tools summary"))
    with page.expect_download() as download_info:
        tap(page, page.get_by_role("button", name="导出学习记录"))
    backup = json.loads(Path(download_info.value.path()).read_text())
    this_year = datetime.now().year
    child = backup["children"][0]
    child["birthYear"] = this_year - 7
    child["ageYears"] = 6
    child["gradeLevel"] = "P1"
    child["levelConfirmedOn"] = f"{this_year - 1}-01-05"
    seeded = SHOTS / "seed-level-review.json"
    seeded.write_text(json.dumps(backup, ensure_ascii=False))
    return backup


def seed_and_open_parent(page, backup):
    page.evaluate("data => localStorage.setItem('little-sprout-family-v1', JSON.stringify(data))", backup)
    page.reload(wait_until="networkidle")
    page.wait_for_selector("text=输入家长密码")
    page.get_by_label("家长密码").fill("2468")
    tap(page, page.get_by_role("button", name="打开家庭学习区"))
    page.wait_for_selector("text=今天谁来学习？")
    open_parent(page)
    page.wait_for_timeout(300)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1180, "height": 820},
        device_scale_factor=1,
        has_touch=True,
        locale="zh-SG",
        timezone_id="Asia/Singapore",
        service_workers="block",
    )
    page = context.new_page()
    page.on("dialog", lambda dialog: dialog.accept())
    page.on("console", lambda msg: errors.append(f"console:{msg.type}:{msg.text}") if msg.type == "error" else None)
    page.on("pageerror", lambda exc: errors.append(f"pageerror:{exc}"))
    page.goto(BASE, wait_until="networkidle")
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(350)

    setup_family(page)
    open_parent(page)
    add_first_child(page)
    backup = export_due_backup(page)

    page.set_viewport_size({"width": 1180, "height": 820})
    seed_and_open_parent(page, backup)
    assert page.get_by_text("新学年确认", exact=True).is_visible()
    assert page.get_by_text("该确认这一学年的年级了", exact=True).is_visible()
    assert page.get_by_text(re.compile("现在约 7 岁")).is_visible()
    assert page.get_by_role("button", name="保持当前年级").is_visible()
    assert page.get_by_role("button", name="升到下一级").is_visible()
    assert "7 岁 · P1 基础" in page.locator(".parent-child-title p").inner_text()
    assert_layout(page, "wide level review")
    shot(page, "33-wide-level-review.png")

    tap(page, page.get_by_role("button", name="升到下一级"))
    page.wait_for_selector(".level-review", state="detached")
    assert page.get_by_label("小年的学习年级").input_value() == "P2"
    assert "P1–P2 全部" in page.locator(".parent-child-title p").inner_text()
    assert_layout(page, "wide level review advanced")
    shot(page, "34-wide-level-review-after.png")

    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(350)
    seed_and_open_parent(page, backup)
    assert page.get_by_text("新学年确认", exact=True).is_visible()
    assert_layout(page, "phone level review")
    shot(page, "35-phone-level-review.png")

    page.get_by_label("界面语言").select_option("en")
    page.wait_for_selector("text=New school year")
    assert page.get_by_text("New school year", exact=True).is_visible()
    assert page.get_by_role("button", name="Move up one level").is_visible()
    assert_layout(page, "phone level review English")
    shot(page, "36-phone-level-review-english.png")

    page.get_by_label("Interface language").select_option("zh")
    page.wait_for_selector("text=新学年确认")
    tap(page, page.get_by_role("button", name="保持当前年级"))
    page.wait_for_selector(".level-review", state="detached")
    assert page.get_by_label("小年的学习年级").input_value() == "P1"
    assert page.get_by_text("新学年确认", exact=True).count() == 0
    assert_layout(page, "phone level review kept")

    assert not errors, f"runtime errors: {errors}"
    print(json.dumps({"checks": checks, "runtime_errors": errors}, ensure_ascii=False, indent=2))
    browser.close()
