from pathlib import Path
import json
import re
import os
from playwright.sync_api import sync_playwright

BASE = os.getenv("BASE_URL", "http://127.0.0.1:4186/family/")
SHOTS = Path("work/family-audit/redesign")
SHOTS.mkdir(parents=True, exist_ok=True)

errors = []
checks = []


def tap(page, locator):
    locator.wait_for(state="visible")
    locator.scroll_into_view_if_needed()
    locator.tap(timeout=10000)


def assert_layout(page, label, require_all_images=True):
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
    broken_images = page.evaluate("""
      [...document.images]
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.getAttribute('src'))
    """)
    if require_all_images:
        assert not broken_images, f"{label}: broken images: {broken_images}"
    checks.append(f"{label}: layout clean")


def wait_image(page, selector):
    img = page.locator(selector)
    img.wait_for(state="visible", timeout=5000)
    page.wait_for_function("img => img.complete && img.naturalWidth > 0", arg=img.element_handle(), timeout=5000)
    return img


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


def close_parent(page):
    tap(page, page.get_by_role("button", name="关闭"))
    page.wait_for_selector("text=今天谁来学习？")


def back_to_profiles(page):
    tap(page, page.locator("button[aria-label='回到孩子选择']"))
    page.wait_for_selector("text=今天谁来学习？")


def add_child(page, name, avatar_label, first=False):
    open_parent(page)
    tap(page, page.get_by_role("button", name="添加第一个孩子" if first else "添加孩子"))
    tap(page, page.get_by_label("孩子的名字"))
    page.get_by_label("孩子的名字").fill(name)
    tap(page, page.get_by_role("button", name=avatar_label))
    tap(page, page.get_by_role("button", name="保存档案"))
    page.get_by_role("heading", name=name).wait_for(state="visible")
    close_parent(page)


def is_match(page):
    return page.get_by_test_id("match-board").count() > 0 and page.get_by_test_id("match-board").first.is_visible()


def answer_current(page):
    if is_match(page):
        pair_ids = page.locator('[data-match-side="left"]').evaluate_all("els => els.map(el => el.dataset.pairId)")
        for pair_id in pair_ids:
            left = page.locator(f'[data-match-side="left"][data-pair-id="{pair_id}"]')
            right = page.locator(f'[data-match-side="right"][data-pair-id="{pair_id}"]')
            tap(page, left)
            page.wait_for_function("el => !el.disabled", arg=right.element_handle(), timeout=2000)
            tap(page, right)
        page.wait_for_selector("[data-testid=answer-feedback]")
        return
    tap(page, page.locator("button[data-correct='true']").first)
    page.wait_for_selector("[data-testid=answer-feedback]")


def finish_session(page, count=8):
    for index in range(count):
        answer_current(page)
        page.wait_for_timeout(120)
        tap(page, page.get_by_role("button", name="Next question"))
        if index < count - 1:
            page.wait_for_selector("[data-testid=question-prompt]")


def open_child(page, name):
    tap(page, page.locator(f"button[aria-label='{name}的学习档案']"))
    page.wait_for_selector("text=跟小芽开始")


def assert_child_art(page):
    for name in ["island-math", "island-mandarin", "island-english"]:
        wait_image(page, f"img[src*='{name}.png']")
    wait_image(page, ".speaking-entry-art img")


with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
    )
    context = browser.new_context(
        viewport={"width": 1180, "height": 820},
        device_scale_factor=1,
        has_touch=True,
        locale="zh-SG",
        timezone_id="Asia/Singapore",
    )
    context.grant_permissions(["microphone"], origin="http://127.0.0.1:4186")
    page = context.new_page()
    page.on("dialog", lambda dialog: dialog.accept())
    page.on("console", lambda msg: errors.append(f"console:{msg.type}:{msg.text}") if msg.type == "error" else None)
    page.on("pageerror", lambda exc: errors.append(f"pageerror:{exc}"))
    page.goto(BASE, wait_until="networkidle")
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(400)

    assert page.get_by_role("heading", name="建立家庭学习区").is_visible()
    assert_layout(page, "wide setup")
    shot(page, "01-wide-setup.png")

    setup_family(page)
    page.wait_for_selector("text=还没有孩子档案")
    wait_image(page, ".empty-scene")
    assert_layout(page, "wide profiles empty")
    shot(page, "02-wide-profiles-empty.png")

    add_child(page, "小星", "星星头像", first=True)
    add_child(page, "小月", "月亮头像")
    wait_image(page, ".profiles-welcome-art img")
    assert_layout(page, "wide profiles welcome")
    shot(page, "03-wide-profiles-welcome.png")

    open_child(page, "小星")
    assert_child_art(page)
    assert page.locator(".companion-star-meter svg").count() == 10, "expected 10 star slots"
    assert_layout(page, "wide child home art")
    shot(page, "04-wide-child-home.png")

    tap(page, page.get_by_role("button", name="写字练习"))
    page.wait_for_selector("text=看笔顺，亲手写")
    page.wait_for_selector("text=轮到你写", timeout=8000)
    page.wait_for_timeout(300)
    assert_layout(page, "wide handwriting")
    shot(page, "04b-wide-handwriting.png")
    tap(page, page.get_by_role("button", name="返回"))
    page.wait_for_selector("button[aria-label='数学 Math']")

    tap(page, page.get_by_role("button", name="声音小游戏"))
    page.wait_for_selector("text=听一听，跟着说")
    wait_image(page, ".speaking-teacher-art img")
    assert_layout(page, "wide speaking art")
    shot(page, "05-wide-speaking.png")
    tap(page, page.get_by_role("button", name="返回"))
    page.wait_for_selector("button[aria-label='数学 Math']")

    tap(page, page.get_by_role("button", name="数学 Math"))
    page.wait_for_selector(".quiz-layout")
    assert page.locator(".quiz-skill-chip").is_visible()
    assert page.get_by_text("Math tool").is_visible(), "expected math tool"
    assert page.get_by_text("Place value").is_visible(), "expected place-value tool"
    assert_layout(page, "wide quiz initial")
    shot(page, "06-wide-quiz.png")
    tap(page, page.get_by_role("button", name="Hint"))
    page.wait_for_timeout(250)
    assert page.get_by_text("Sprout\'s hint", exact=True).is_visible(), "expected hint card"
    assert_layout(page, "wide quiz hint")
    shot(page, "06b-wide-quiz-hint.png")
    answer_current(page)
    assert page.get_by_role("button", name="Read the explanation").is_visible(), "expected explanation audio"
    assert_layout(page, "wide quiz feedback")
    shot(page, "07-wide-quiz-feedback.png")
    for index in range(7):
        tap(page, page.get_by_role("button", name="Next question"))
        page.wait_for_selector("[data-testid=question-prompt]")
        answer_current(page)
        page.wait_for_timeout(120)
    tap(page, page.get_by_role("button", name="Next question"))
    page.wait_for_selector("text=starting check complete")
    wait_image(page, ".result-hero-art img")
    assert_layout(page, "wide result art")
    shot(page, "08-wide-result.png")
    tap(page, page.get_by_role("button", name="Back to learning"))
    page.wait_for_selector("button[aria-label='数学 Math']")
    tap(page, page.get_by_role("button", name="数学 Math"))
    page.wait_for_selector(".quiz-layout")
    page.wait_for_timeout(300)
    assert_layout(page, "wide practice first question")
    shot(page, "08b-wide-practice.png")
    tap(page, page.get_by_role("button", name="Exit"))
    page.wait_for_selector("button[aria-label='数学 Math']")
    back_to_profiles(page)

    open_parent(page)
    assert_layout(page, "wide parent dashboard")
    assert page.get_by_label("小星的学习年级").is_visible(), "expected learning scope selector"
    assert page.get_by_label("小星的其他练习").get_by_text("写字练习").is_visible(), "expected handwriting progress"
    tap(page, page.locator(".content-provenance summary"))
    page.wait_for_timeout(200)
    shot(page, "09-wide-parent-dashboard.png")

    page.get_by_label("小星的学习年级").select_option("P1")
    page.wait_for_timeout(300)
    assert page.get_by_label("小星的学习年级").input_value() == "P1"
    page.get_by_label("小星的学习年级").select_option("P2")
    page.wait_for_timeout(300)
    assert page.get_by_label("小星的学习年级").input_value() == "P2"

    tap(page, page.locator(".data-tools summary"))
    with page.expect_download() as download_info:
        tap(page, page.get_by_role("button", name="导出学习记录"))
    backup_path = Path(download_info.value.path())
    backup = json.loads(backup_path.read_text())
    backup["children"][0]["rewards"]["lifetimeStars"] = 12
    seeded = SHOTS / "seed-stars.json"
    seeded.write_text(json.dumps(backup, ensure_ascii=False))
    page.locator("input[type=file]").set_input_files(str(seeded.resolve()))
    page.wait_for_timeout(900)
    assert_layout(page, "wide parent dashboard seeded")
    shot(page, "10-wide-parent-seeded.png")
    close_parent(page)

    open_child(page, "小星")
    assert page.locator(".companion-star-meter svg").count() == 0, "star meter should hide once redeemable"
    assert "12" in page.get_by_role("button", name="打开伙伴兑换商城").inner_text()
    tap(page, page.get_by_role("button", name="打开伙伴兑换商城"))
    page.wait_for_selector(".companion-shop")
    wait_image(page, ".companion-shop-card.is-coming img")
    assert_layout(page, "wide companion shop")
    shot(page, "11-wide-companion-shop.png")
    tap(page, page.get_by_role("button", name="兑换", exact=True))
    page.wait_for_selector("text=兑换后会加入你的伙伴收藏")
    shot(page, "12-wide-companion-confirm.png")
    tap(page, page.get_by_role("button", name="确认兑换"))
    page.wait_for_selector("text=已经拥有")
    tap(page, page.get_by_role("button", name="让豆豆陪我"))
    page.wait_for_selector("text=正在陪伴")
    assert_layout(page, "wide companion owned")
    shot(page, "13-wide-companion-owned.png")
    tap(page, page.get_by_role("button", name="返回"))
    page.wait_for_selector("button[aria-label='数学 Math']")
    back_to_profiles(page)

    page.set_viewport_size({"width": 768, "height": 1024})
    page.wait_for_timeout(350)
    assert_layout(page, "portrait profiles")
    shot(page, "14-portrait-profiles.png")
    open_child(page, "小星")
    assert_layout(page, "portrait child home")
    shot(page, "15-portrait-child-home.png")
    tap(page, page.get_by_role("button", name="数学 Math"))
    page.wait_for_selector(".quiz-layout")
    assert_layout(page, "portrait quiz")
    shot(page, "16-portrait-quiz.png")

    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(350)
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(300)
    if page.get_by_role("heading", name="输入家长密码").is_visible():
        tap(page, page.get_by_label("家长密码"))
        page.get_by_label("家长密码").fill("2468")
        tap(page, page.get_by_role("button", name="打开家庭学习区"))
    page.wait_for_selector("text=今天谁来学习？")
    assert_layout(page, "phone profiles")
    shot(page, "17-phone-profiles.png")
    open_child(page, "小星")
    assert_layout(page, "phone child home")
    shot(page, "18-phone-child-home.png")
    tap(page, page.get_by_role("button", name="写字练习"))
    page.wait_for_selector("text=看笔顺，亲手写")
    page.wait_for_selector("text=轮到你写", timeout=8000)
    page.wait_for_timeout(300)
    assert_layout(page, "phone handwriting")
    shot(page, "18b-phone-handwriting.png")
    tap(page, page.get_by_role("button", name="返回"))
    page.wait_for_selector("button[aria-label='英语 English']")
    tap(page, page.get_by_role("button", name="英语 English"))
    page.wait_for_selector(".quiz-layout")
    assert_layout(page, "phone quiz")
    shot(page, "19-phone-quiz.png")
    tap(page, page.get_by_role("button", name="Hint"))
    page.wait_for_timeout(180)
    assert page.get_by_text("Sprout's hint", exact=True).is_visible()
    assert_layout(page, "phone quiz English hint")
    shot(page, "19c-phone-quiz-hint.png")
    answer_current(page)
    page.wait_for_timeout(650)
    assert_layout(page, "phone quiz feedback")
    feedback_box = page.locator("[data-testid=answer-feedback]").bounding_box()
    assert feedback_box and feedback_box["y"] >= 0 and feedback_box["y"] < 844, f"feedback not in viewport: {feedback_box}"
    shot(page, "19b-phone-quiz-feedback.png")
    tap(page, page.get_by_role("button", name="Next question"))
    page.wait_for_selector("[data-testid=question-prompt]")
    finish_session(page, 7)
    page.wait_for_selector("text=English starting check complete")
    assert_layout(page, "phone result")
    shot(page, "20-phone-result.png")
    tap(page, page.locator(".result-details summary"))
    assert page.locator(".result-row").count() == 8, "result detail rows should expand to 8"
    shot(page, "20b-phone-result-details.png")

    tap(page, page.get_by_role("button", name="Back to learning"))
    page.wait_for_selector("button[aria-label='华文 Mandarin']")
    tap(page, page.locator("button[aria-label='华文 Mandarin']"))
    page.wait_for_selector(".quiz-layout")
    assert page.get_by_text("华文起点小试").is_visible()
    assert page.get_by_role("button", name="提示").is_visible()
    assert_layout(page, "phone quiz Mandarin")
    shot(page, "19d-phone-mandarin.png")
    tap(page, page.get_by_role("button", name="退出"))
    page.wait_for_selector("button[aria-label='华文 Mandarin']")
    back_to_profiles(page)

    open_parent(page)
    assert_layout(page, "phone parent dashboard")
    assert page.get_by_label("小星的学习年级").is_visible(), "expected learning scope selector"
    assert page.get_by_label("小星的其他练习").get_by_text("写字练习").is_visible(), "expected handwriting progress"
    shot(page, "21-phone-parent.png")

    close_parent(page)
    open_child(page, "小星")
    tap(page, page.get_by_role("button", name="打开伙伴兑换商城"))
    page.wait_for_selector(".companion-shop")
    tap(page, page.get_by_role("tab", name="我的伙伴"))
    page.wait_for_timeout(250)
    assert_layout(page, "phone companion shop")
    shot(page, "22-phone-companion-shop.png")

    # System language switch: English parent/home, while Maths stays English
    tap(page, page.get_by_role("button", name="返回"))
    page.wait_for_selector("button[aria-label='数学 Math']")
    back_to_profiles(page)
    page.set_viewport_size({"width": 1180, "height": 820})
    page.wait_for_timeout(300)
    open_parent(page)
    page.get_by_label("界面语言").select_option("en")
    page.wait_for_selector("text=Your child's learning")
    assert_layout(page, "wide parent English")
    shot(page, "09b-wide-parent-english.png")
    tap(page, page.get_by_role("button", name="Close"))
    page.wait_for_selector("text=Who is learning today?")
    assert_layout(page, "wide profiles English")
    shot(page, "03b-wide-profiles-english.png")
    tap(page, page.locator("button[aria-label=\"小星's learning profile\"]"))
    page.wait_for_selector("text=Start with Sprout")
    assert page.get_by_role("button", name="Mathematics", exact=True).is_visible()
    assert page.get_by_role("button", name="Chinese", exact=True).is_visible()
    assert page.get_by_role("button", name="English", exact=True).is_visible()
    assert_layout(page, "wide child home English")
    shot(page, "04c-wide-child-home-english.png")
    tap(page, page.get_by_role("button", name="Open the Companion Shop"))
    page.wait_for_selector("text=My learning companions")
    assert page.get_by_role("button", name="Back to the child home").is_visible()
    assert_layout(page, "wide companion shop English")
    shot(page, "11b-wide-companion-shop-english.png")
    tap(page, page.get_by_role("button", name="Back to the child home"))
    page.wait_for_selector("text=Start with Sprout")
    tap(page, page.get_by_role("button", name="Mathematics", exact=True))
    page.wait_for_selector(".quiz-layout")
    assert page.get_by_text("Math tool").is_visible()
    assert page.get_by_role("button", name="Hint").is_visible()
    assert_layout(page, "wide quiz English system")
    shot(page, "06c-wide-quiz-english-system.png")
    tap(page, page.get_by_role("button", name="Exit"))
    page.wait_for_selector("text=Start with Sprout")
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(350)
    assert_layout(page, "phone child home English")
    shot(page, "18c-phone-child-home-english.png")
    tap(page, page.get_by_role("button", name="Open the Companion Shop"))
    page.wait_for_selector("text=My learning companions")
    assert_layout(page, "phone companion shop English")
    shot(page, "22b-phone-companion-shop-english.png")
    tap(page, page.get_by_role("button", name="Back to the child home"))
    page.wait_for_selector("text=Start with Sprout")
    tap(page, page.get_by_role("button", name="Back to profiles"))
    page.wait_for_selector("text=Who is learning today?")
    assert_layout(page, "phone profiles English")
    shot(page, "17b-phone-profiles-english.png")
    tap(page, page.get_by_role("button", name="Parent settings"))
    page.wait_for_selector("text=Open parent settings")
    page.get_by_label("Confirm parent PIN").fill("2468")
    tap(page, page.get_by_role("button", name="Open settings"))
    page.wait_for_selector("text=Your child's learning")
    assert_layout(page, "phone parent English")
    shot(page, "21b-phone-parent-english.png")
    tap(page, page.get_by_role("button", name="Close"))
    page.wait_for_selector("text=Who is learning today?")

    tap(page, page.get_by_role("button", name="Lock"))
    page.wait_for_selector("text=Enter the parent PIN")
    assert_layout(page, "phone secure unlock English")
    shot(page, "25b-phone-secure-unlock-english.png")
    page.get_by_label("Parent PIN").fill("2468")
    tap(page, page.get_by_role("button", name="Open family space"))
    page.wait_for_selector("text=Who is learning today?")

    # Empty parent state on a fresh household, wide then phone
    page.set_viewport_size({"width": 1180, "height": 820})
    page.wait_for_timeout(300)
    page.evaluate("localStorage.clear()")
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(300)
    setup_family(page)
    open_parent(page)
    assert page.get_by_text("还没有孩子档案。先添加一个孩子。").is_visible()
    wait_image(page, ".parent-empty .empty-scene")
    assert_layout(page, "wide parent empty")
    shot(page, "23-wide-parent-empty.png")

    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(350)
    assert_layout(page, "phone parent empty")
    shot(page, "24-phone-parent-empty.png")

    assert not errors, f"Runtime errors: {errors}"
    print("\n".join(checks))
    print(f"\n{len(checks)} checks passed, {len(errors)} runtime errors")
    browser.close()
