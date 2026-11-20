from pathlib import Path
import re
import json
import os
from playwright.sync_api import sync_playwright

BASE = os.getenv("BASE_URL", "http://127.0.0.1:4185/family/")
SHOTS = Path("work/family-audit")
SHOTS.mkdir(parents=True, exist_ok=True)

errors = []
checks = []

def tap(page, locator):
    locator.wait_for(state="visible")
    locator.evaluate("(el) => el.scrollIntoView({ block: 'center', inline: 'nearest' })")
    page.wait_for_timeout(40)
    box = locator.bounding_box()
    assert box, "Missing touch target bounding box"
    page.touchscreen.tap(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)

def assert_clean_layout(page, label):
    overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    assert overflow <= 1, f"{label}: horizontal overflow {overflow}px"
    small_targets = page.evaluate("""
      [...document.querySelectorAll('button')]
        .filter((el) => {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
        })
        .map((el) => ({ text: el.textContent.trim().slice(0, 40), w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height }))
    """)
    assert not small_targets, f"{label}: touch targets below 44px: {small_targets}"
    broken_images = page.evaluate("""
      [...document.images]
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.getAttribute('src'))
    """)
    assert not broken_images, f"{label}: broken images: {broken_images}"
    checks.append(f"{label}: layout clean, no overflow, all visible buttons >=44px")

def setup_family(page):
    tap(page, page.get_by_label("家庭名称"))
    page.get_by_label("家庭名称").fill("我们的学习区")
    tap(page, page.get_by_label("家长称呼"))
    page.get_by_label("家长称呼").fill("妈妈")
    tap(page, page.get_by_label("家长密码"))
    page.get_by_label("家长密码").fill("2468")
    tap(page, page.get_by_role("button", name="建立家庭学习区"))
    page.wait_for_selector("text=今天谁来学习？")

def open_parent_settings(page):
    tap(page, page.get_by_role("button", name="家长设置"))
    page.wait_for_selector("text=进入家长设置")
    tap(page, page.get_by_label("家长密码确认"))
    page.get_by_label("家长密码确认").fill("2468")
    tap(page, page.get_by_role("button", name="进入设置"))
    page.wait_for_selector("text=孩子学习概览")

def add_child(page, name, avatar_label, first=False):
    open_parent_settings(page)
    tap(page, page.get_by_role("button", name="添加第一个孩子" if first else "添加孩子"))
    tap(page, page.get_by_label("孩子的名字"))
    page.get_by_label("孩子的名字").fill(name)
    tap(page, page.get_by_role("button", name=avatar_label))
    tap(page, page.get_by_role("button", name="保存档案"))
    page.get_by_role("heading", name=name).wait_for(state="visible")
    tap(page, page.get_by_role("button", name="关闭"))
    page.wait_for_selector(f"button[aria-label='{name}的学习档案']")

def answer_diagnostic(page, count=8):
    for index in range(count):
        tap(page, page.locator("button[data-correct='true']").first)
        page.wait_for_timeout(220)
        assert page.get_by_test_id("answer-feedback").is_visible()
        next_button = page.get_by_role("button", name="下一题")
        if index == count - 1:
            box = next_button.bounding_box()
            assert box, "Missing final next button bounding box"
            x = box["x"] + box["width"] / 2
            y = box["y"] + box["height"] / 2
            page.touchscreen.tap(x, y)
            page.touchscreen.tap(x, y)
        else:
            tap(page, next_button)
        if index < count - 1:
            page.wait_for_timeout(150)


with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
    )
    context = browser.new_context(
        viewport={"width": 1024, "height": 768},
        device_scale_factor=1,
        has_touch=True,
        locale="zh-SG",
        timezone_id="Asia/Singapore",
    )
    context.grant_permissions(["microphone"], origin="http://127.0.0.1:4185")
    page = context.new_page()
    page.on("dialog", lambda dialog: dialog.accept())
    page.on("console", lambda msg: errors.append(f"console:{msg.type}:{msg.text}") if msg.type == "error" else None)
    page.on("pageerror", lambda exc: errors.append(f"pageerror:{exc}"))
    page.goto(BASE, wait_until="networkidle")
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(350)

    assert page.get_by_role("heading", name="建立家庭学习区").is_visible()
    assert_clean_layout(page, "iPad landscape setup")
    page.screenshot(path=str(SHOTS / "01-ipad-landscape-setup.png"), full_page=True)
    setup_family(page)

    assert page.get_by_role("heading", name="今天谁来学习？").is_visible()
    assert_clean_layout(page, "iPad landscape empty profiles")
    page.screenshot(path=str(SHOTS / "02-ipad-landscape-profiles-empty.png"), full_page=True)
    add_child(page, "小星", "星星头像", first=True)
    assert page.locator("button[aria-label='小星的学习档案']").is_visible()
    page.screenshot(path=str(SHOTS / "03-ipad-landscape-one-child.png"), full_page=True)

    add_child(page, "小月", "月亮头像")
    assert page.locator("button[aria-label='小月的学习档案']").is_visible()
    tap(page, page.locator("button[aria-label='小星的学习档案']"))
    assert page.get_by_role("heading", name="小星，今天想学哪一科？").is_visible()
    assert_clean_layout(page, "iPad landscape child home")
    page.screenshot(path=str(SHOTS / "04-ipad-landscape-child-home.png"), full_page=True)

    tap(page, page.get_by_role("button", name="听一听，跟着说"))
    assert page.get_by_role("heading", name="听一听，跟着说").is_visible()
    assert_clean_layout(page, "iPad landscape speaking")
    tap(page, page.get_by_role("button", name="开始说"))
    page.wait_for_selector("text=停止录音")
    page.wait_for_timeout(800)
    tap(page, page.get_by_role("button", name="停止录音"))
    page.wait_for_selector("text=听自己")
    tap(page, page.get_by_role("button", name="听自己"))
    page.wait_for_timeout(500)
    assert page.get_by_role("button", name="下一个").is_visible()
    page.screenshot(path=str(SHOTS / "04a-ipad-landscape-speaking.png"), full_page=True)
    tap(page, page.get_by_role("button", name="返回"))
    page.wait_for_selector("button[aria-label='数学 Math']")

    tap(page, page.get_by_role("button", name="看笔顺，亲手写"))
    assert page.get_by_role("heading", name="看笔顺，亲手写").is_visible()
    assert page.get_by_text("人", exact=True).first.is_visible()
    assert_clean_layout(page, "iPad landscape handwriting")
    page.screenshot(path=str(SHOTS / "04b-ipad-landscape-handwriting.png"), full_page=True)
    page.wait_for_selector("text=轮到你写")
    tap(page, page.get_by_role("button", name="朗读 人"))
    page.wait_for_timeout(300)
    page.wait_for_timeout(900)
    transform = page.locator(".hanzi-target svg g").first.get_attribute("transform") or ""
    match = re.search(r"translate\(([-0-9.]+), ([-0-9.]+)\) scale\(([-0-9.]+),", transform)
    assert match, f"Unexpected Hanzi transform: {transform}"
    tx, ty, scale = map(float, match.groups())
    box = page.locator(".hanzi-target").bounding_box()
    assert box
    with open("assets/hanzi/人.json", encoding="utf-8") as handle:
        medians = json.load(handle)["medians"]
    for median in medians:
        points = [(box["x"] + tx + x * scale, box["y"] + ty - y * scale) for x, y in median]
        page.mouse.move(*points[0])
        page.mouse.down()
        for point in points[1:]:
            page.mouse.move(point[0], point[1], steps=4)
        page.mouse.up()
        page.wait_for_timeout(120)
    page.wait_for_selector(".handwriting-feedback")
    assert "写得很准" in page.locator(".handwriting-feedback").inner_text()
    page.screenshot(path=str(SHOTS / "04c-ipad-landscape-handwriting-done.png"), full_page=True)
    tap(page, page.get_by_role("button", name="返回"))
    page.wait_for_selector("button[aria-label='数学 Math']")
    assert "1 / 12" in page.get_by_role("button", name=re.compile("看笔顺，亲手写")).inner_text()

    tap(page, page.get_by_role("button", name="数学 Math"))
    assert page.get_by_role("heading", name="数学起点小试").is_visible()
    assert_clean_layout(page, "iPad landscape quiz")
    page.screenshot(path=str(SHOTS / "05-ipad-landscape-math-question.png"), full_page=True)
    wrong_option = page.locator("button[data-correct='false']").first
    tap(page, wrong_option)
    tap(page, wrong_option)
    page.wait_for_selector("[data-testid=answer-feedback]")
    assert "1 / 8" in page.locator(".session-progress").inner_text()
    assert page.locator(".wrong-feedback").is_visible()
    assert "is-correct-answer" in (page.locator("button[data-correct='true']").first.get_attribute("class") or "")
    page.wait_for_timeout(320)
    page.screenshot(path=str(SHOTS / "05b-ipad-landscape-wrong-feedback.png"), full_page=True)
    tap(page, page.get_by_role("button", name="下一题"))
    answer_diagnostic(page, 7)
    assert page.get_by_role("heading", name="数学起点小试完成").is_visible()
    assert_clean_layout(page, "iPad landscape result")
    page.screenshot(path=str(SHOTS / "06-ipad-landscape-result.png"), full_page=True)

    tap(page, page.get_by_role("button", name="家长设置"))
    assert page.get_by_role("heading", name="进入家长设置").is_visible()
    tap(page, page.get_by_label("家长密码确认"))
    page.get_by_label("家长密码确认").fill("2468")
    tap(page, page.get_by_role("button", name="进入设置"))
    assert page.get_by_role("heading", name="孩子学习概览").is_visible()
    assert_clean_layout(page, "iPad landscape parent dashboard")
    with page.expect_download() as download_info:
        tap(page, page.get_by_role("button", name="导出作答 CSV").first)
    download_path = download_info.value.path()
    assert download_path is not None
    assert b"child_name" in Path(download_path).read_bytes()
    page.screenshot(path=str(SHOTS / "07-ipad-landscape-parent-dashboard.png"), full_page=True)

    tap(page, page.get_by_role("button", name="关闭"))
    page.wait_for_timeout(250)
    tap(page, page.locator("button[aria-label='小月的学习档案']"))
    tap(page, page.get_by_role("button", name="华文 Mandarin"))
    tap(page, page.get_by_role("button", name="朗读题目"))
    answer_diagnostic(page)
    assert page.get_by_role("heading", name="华文起点小试完成").is_visible()
    tap(page, page.get_by_role("button", name="回到学习区"))
    tap(page, page.get_by_role("button", name="英语 English"))
    tap(page, page.locator("button[data-correct='true']").first)
    page.wait_for_selector("[data-testid=answer-feedback]")
    feedback = page.get_by_test_id("answer-feedback")
    feedback.scroll_into_view_if_needed()
    feedback_box = feedback.bounding_box()
    quiz_box = page.locator(".quiz-layout").bounding_box()
    assert feedback_box and quiz_box
    assert feedback_box["y"] + feedback_box["height"] <= quiz_box["y"] + quiz_box["height"] + 1, "feedback is clipped by quiz container"
    assert_clean_layout(page, "iPad landscape English feedback")
    page.screenshot(path=str(SHOTS / "08-ipad-landscape-english-feedback.png"), full_page=True)
    tap(page, page.get_by_role("button", name="下一题"))
    for _ in range(7):
        tap(page, page.locator("button[data-correct='true']").first)
        page.wait_for_selector("[data-testid=answer-feedback]")
        tap(page, page.get_by_role("button", name="下一题"))
        page.wait_for_timeout(130)
    assert page.get_by_role("heading", name="英语起点小试完成").is_visible()
    tap(page, page.get_by_role("button", name="家长设置"))
    tap(page, page.get_by_label("家长密码确认"))
    page.get_by_label("家长密码确认").fill("2468")
    tap(page, page.get_by_role("button", name="进入设置"))
    assert page.get_by_role("heading", name="孩子学习概览").is_visible()
    assert page.get_by_text("小月").is_visible()
    assert page.get_by_text("16 题已完成 · 2 科完成起点小试").is_visible()
    assert page.get_by_text(re.compile(r"近 7 天 \d+ 题")).first.is_visible()
    assert page.get_by_role("button", name="导出作答 CSV").first.is_visible()
    page.screenshot(path=str(SHOTS / "08b-ipad-landscape-three-subject-dashboard.png"), full_page=True)
    tap(page, page.get_by_role("button", name="关闭"))

    page.reload(wait_until="networkidle")
    page.wait_for_timeout(300)
    assert page.get_by_role("heading", name="输入家长密码").is_visible()
    tap(page, page.get_by_label("家长密码"))
    page.get_by_label("家长密码").fill("2468")
    tap(page, page.get_by_role("button", name="打开家庭学习区"))
    page.wait_for_selector("text=今天谁来学习？")

    page.set_viewport_size({"width": 768, "height": 1024})
    page.wait_for_timeout(300)
    assert_clean_layout(page, "iPad portrait profiles")
    page.screenshot(path=str(SHOTS / "09-ipad-portrait-profiles.png"), full_page=True)
    tap(page, page.locator("button[aria-label='小星的学习档案']"))
    assert_clean_layout(page, "iPad portrait child home")
    page.screenshot(path=str(SHOTS / "10-ipad-portrait-child-home.png"), full_page=True)
    tap(page, page.get_by_role("button", name="数学 Math"))
    page.wait_for_timeout(250)
    assert_clean_layout(page, "iPad portrait quiz")
    page.screenshot(path=str(SHOTS / "11-ipad-portrait-quiz.png"), full_page=True)

    page.set_viewport_size({"width": 1280, "height": 800})
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(300)
    if page.get_by_role("heading", name="输入家长密码").is_visible():
        tap(page, page.get_by_label("家长密码"))
        page.get_by_label("家长密码").fill("2468")
        tap(page, page.get_by_role("button", name="打开家庭学习区"))
    page.wait_for_selector("text=今天谁来学习？")
    assert_clean_layout(page, "Android tablet landscape profiles")
    page.screenshot(path=str(SHOTS / "12-android-tablet-landscape-profiles.png"), full_page=True)
    tap(page, page.locator("button[aria-label='小星的学习档案']"))
    assert_clean_layout(page, "Android tablet landscape child home")
    page.screenshot(path=str(SHOTS / "12a-android-tablet-landscape-child-home.png"), full_page=True)
    page.set_viewport_size({"width": 800, "height": 1280})
    page.wait_for_timeout(250)
    assert_clean_layout(page, "Android tablet portrait child home")
    page.screenshot(path=str(SHOTS / "12b-android-tablet-portrait-child-home.png"), full_page=True)

    page.evaluate("navigator.serviceWorker.ready.then((registration) => Boolean(registration.active))")
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(300)
    context.set_offline(True)
    page.reload(wait_until="domcontentloaded")
    page.wait_for_timeout(350)
    assert page.get_by_role("heading", name="输入家长密码").is_visible()
    context.set_offline(False)

    fresh_context = browser.new_context(viewport={"width": 1024, "height": 768}, has_touch=True, locale="zh-SG", timezone_id="Asia/Singapore")
    fresh_page = fresh_context.new_page()
    fresh_page.goto(BASE, wait_until="networkidle")
    fresh_page.evaluate("navigator.serviceWorker.ready.then((registration) => Boolean(registration.active))")
    fresh_context.set_offline(True)
    fresh_page.reload(wait_until="domcontentloaded")
    fresh_page.wait_for_timeout(300)
    assert fresh_page.get_by_role("heading", name="建立家庭学习区").is_visible()
    fresh_context.set_offline(False)

    assert not errors, "Browser errors:\n" + "\n".join(errors)
    print("PASS: touch setup, profiles, add children, three subject entry points, 8-question diagnostic, parent PIN dashboard, reload lock, offline shell")
    for check in checks:
        print(check)
    browser.close()
