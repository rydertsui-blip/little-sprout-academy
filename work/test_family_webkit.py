from pathlib import Path
import os
from playwright.sync_api import sync_playwright

BASE = os.getenv("BASE_URL", "http://127.0.0.1:4185/family/")
SHOTS = Path("work/family-audit")
errors = []

def tap(page, locator):
    locator.wait_for(state="visible")
    locator.evaluate("(el) => el.scrollIntoView({ block: 'center', inline: 'nearest' })")
    page.wait_for_timeout(40)
    box = locator.bounding_box()
    assert box, "Missing touch target"
    page.touchscreen.tap(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)

def assert_layout(page, label):
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1"), f"{label}: horizontal overflow"
    broken = page.evaluate("[...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src)")
    assert not broken, f"{label}: broken images {broken}"

def is_matching_question(page):
    board = page.get_by_test_id("match-board")
    return board.count() > 0 and board.first.is_visible()

def tap_match_pair(page, pair_id):
    left = page.locator(f'[data-match-side="left"][data-pair-id="{pair_id}"]')
    right = page.locator(f'[data-match-side="right"][data-pair-id="{pair_id}"]')
    tap(page, left)
    page.wait_for_function("el => !el.disabled", arg=right.element_handle(), timeout=2000)
    tap(page, right)

def answer_current(page, correct=True):
    if is_matching_question(page):
        pair_ids = page.locator('[data-match-side="left"]').evaluate_all("els => els.map(el => el.dataset.pairId)")
        assert len(pair_ids) == 3
        if not correct:
            left = page.locator(f'[data-match-side="left"][data-pair-id="{pair_ids[0]}"]')
            wrong = page.locator(f'[data-match-side="right"][data-pair-id="{pair_ids[1]}"]')
            tap(page, left)
            page.wait_for_function("el => !el.disabled", arg=wrong.element_handle(), timeout=2000)
            tap(page, wrong)
            page.wait_for_function("document.querySelector('.match-status').textContent.includes('不相配')")
        for pair_id in pair_ids:
            tap_match_pair(page, pair_id)
        page.wait_for_selector("[data-testid=answer-feedback]")
        return "match"
    selector = "button[data-correct='true']" if correct else "button[data-correct='false']"
    tap(page, page.locator(selector).first)
    page.wait_for_selector("[data-testid=answer-feedback]")
    return "choice"

with sync_playwright() as p:
    browser = p.webkit.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1024, "height": 768},
        has_touch=True,
        locale="zh-SG",
        timezone_id="Asia/Singapore",
        reduced_motion="reduce",
    )
    page = context.new_page()
    page.add_init_script("""
      class SilentAudio {
        constructor(src) { this.src = src; this.currentTime = 0; }
        load() {}
        play() { return Promise.resolve(); }
        pause() {}
      }
      window.Audio = SilentAudio;
      Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: { cancel() {}, getVoices() { return []; }, speak() {} }
      });
    """)
    page.on("console", lambda msg: errors.append(f"console:{msg.type}:{msg.text}") if msg.type == "error" else None)
    page.on("pageerror", lambda exc: errors.append(f"pageerror:{exc}"))
    page.goto(BASE, wait_until="networkidle")
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(350)
    assert_layout(page, "WebKit setup")

    tap(page, page.get_by_label("家庭名称"))
    page.get_by_label("家庭名称").fill("Safari 学习区")
    tap(page, page.get_by_label("家长称呼"))
    page.get_by_label("家长称呼").fill("妈妈")
    tap(page, page.get_by_label("家长密码"))
    page.get_by_label("家长密码").fill("2468")
    tap(page, page.get_by_role("button", name="建立家庭学习区"))
    page.wait_for_selector("text=今天谁来学习？")
    tap(page, page.get_by_role("button", name="家长设置"))
    tap(page, page.get_by_label("家长密码确认"))
    page.get_by_label("家长密码确认").fill("2468")
    tap(page, page.get_by_role("button", name="进入设置"))
    page.wait_for_selector("text=孩子学习概览")
    tap(page, page.get_by_role("button", name="添加第一个孩子"))
    tap(page, page.get_by_label("孩子的名字"))
    page.get_by_label("孩子的名字").fill("小苹果")
    tap(page, page.get_by_role("button", name="花朵头像"))
    tap(page, page.get_by_role("button", name="保存档案"))
    page.get_by_role("heading", name="小苹果").wait_for(state="visible")
    tap(page, page.get_by_role("button", name="关闭"))
    page.wait_for_selector("button[aria-label='小苹果的学习档案']")
    assert_layout(page, "WebKit profiles")
    page.screenshot(path=str(SHOTS / "13-webkit-ipad-profiles.png"), full_page=True)

    tap(page, page.locator("button[aria-label='小苹果的学习档案']"))
    assert_layout(page, "WebKit child home")
    tap(page, page.get_by_role("button", name="声音小游戏"))
    page.wait_for_selector("text=听一听，跟着说")
    assert_layout(page, "WebKit speaking")
    tap(page, page.get_by_role("button", name="看图说两句"))
    page.wait_for_selector("text=苹果")
    assert page.locator(".speaking-image").is_visible()
    page.wait_for_function("(img) => img.complete && img.naturalWidth > 0", arg=page.locator(".speaking-image").element_handle(), timeout=2000)
    assert page.locator(".speaking-image").evaluate("(img) => img.naturalWidth > 0")
    start_box = page.get_by_role("button", name="开始说").bounding_box()
    assert start_box and start_box["y"] + start_box["height"] <= page.viewport_size["height"] + 1
    tap(page, page.get_by_role("button", name="朗读"))
    page.wait_for_selector("text=我爱妈妈。")
    tap(page, page.get_by_role("button", name="情境开口"))
    page.wait_for_selector("text=Hello! How are you?")
    page.get_by_role("button", name="返回").evaluate("(el) => el.click()")
    page.wait_for_timeout(300)
    assert page.get_by_role("button", name="看笔顺，亲手写").count() == 0
    page.wait_for_selector("button[aria-label='数学 Math']")
    tap(page, page.get_by_role("button", name="数学 Math"))
    page.wait_for_timeout(300)
    assert_layout(page, "WebKit math quiz")
    question_kind = answer_current(page, correct=False)
    page.wait_for_timeout(320)
    assert page.locator(".wrong-feedback").is_visible()
    if question_kind == "choice":
        assert "is-correct-answer" in (page.locator("button[data-correct='true']").first.get_attribute("class") or "")
    else:
        assert "刚才有配错" in page.get_by_test_id("answer-feedback").inner_text()
    page.screenshot(path=str(SHOTS / "14-webkit-ipad-feedback.png"), full_page=True)
    tap(page, page.get_by_role("button", name="下一题"))
    tap(page, page.get_by_role("button", name="退出"))
    tap(page, page.get_by_role("button", name="英语 English"))
    page.wait_for_timeout(300)
    answer_current(page)
    page.wait_for_timeout(320)
    assert "1 / 8" in page.locator(".session-progress").inner_text()

    page.reload(wait_until="networkidle")
    page.wait_for_timeout(300)
    assert page.get_by_role("heading", name="输入家长密码").is_visible()
    tap(page, page.get_by_label("家长密码"))
    page.get_by_label("家长密码").fill("2468")
    tap(page, page.get_by_role("button", name="打开家庭学习区"))
    page.wait_for_selector("text=今天谁来学习？")

    page.set_viewport_size({"width": 768, "height": 1024})
    page.wait_for_timeout(300)
    assert_layout(page, "WebKit portrait profiles")
    page.screenshot(path=str(SHOTS / "15-webkit-ipad-portrait.png"), full_page=True)

    page.set_viewport_size({"width": 1180, "height": 820})
    page.wait_for_timeout(250)
    assert_layout(page, "WebKit iPad 10.9 landscape")
    page.set_viewport_size({"width": 820, "height": 1180})
    page.wait_for_timeout(250)
    assert_layout(page, "WebKit iPad 10.9 portrait")
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(250)
    assert_layout(page, "WebKit iPhone portrait")
    page.screenshot(path=str(SHOTS / "16-webkit-iphone-portrait.png"), full_page=True)
    tap(page, page.locator("button[aria-label='小苹果的学习档案']"))
    assert_layout(page, "WebKit iPhone portrait child home")
    page.screenshot(path=str(SHOTS / "16a-webkit-iphone-child-home.png"), full_page=True)
    page.set_viewport_size({"width": 844, "height": 390})
    page.wait_for_timeout(250)
    assert_layout(page, "WebKit iPhone landscape child home")

    assert not errors, "WebKit browser errors:\n" + "\n".join(errors)
    print("PASS: WebKit touch setup, profile creation, wrong-answer feedback, subject entry, reload lock and portrait layout")
    browser.close()
