from pathlib import Path
import re

from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:4197/"
OUT = Path(__file__).parent / "family-audit"
OUT.mkdir(parents=True, exist_ok=True)


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


def setup_family(page):
    page.get_by_label("家庭名称").fill("奖励验收家庭")
    page.get_by_label("家长称呼").fill("妈妈")
    page.get_by_label("家长密码").fill("2468")
    tap(page, page.get_by_role("button", name="建立家庭学习区"))
    page.wait_for_selector("text=今天谁来学习？")


def add_first_child(page, name):
    tap(page, page.get_by_role("button", name="家长设置"))
    page.wait_for_selector("text=进入家长设置")
    page.get_by_label("家长密码确认").fill("2468")
    tap(page, page.get_by_role("button", name="进入设置"))
    page.wait_for_selector("text=孩子学习概览")
    tap(page, page.get_by_role("button", name="添加第一个孩子"))
    page.get_by_label("孩子的名字").fill(name)
    tap(page, page.get_by_role("button", name="星星头像"))
    tap(page, page.get_by_role("button", name="保存档案"))
    page.get_by_role("heading", name=name).wait_for(state="visible")
    tap(page, page.get_by_role("button", name="关闭"))
    page.wait_for_selector(f"button[aria-label='{name}的学习档案']")


def tap_match_pair(page, pair_id):
    left = page.locator(f'[data-match-side="left"][data-pair-id="{pair_id}"]')
    right = page.locator(f'[data-match-side="right"][data-pair-id="{pair_id}"]')
    tap(page, left)
    page.wait_for_function("el => !el.disabled", arg=right.element_handle(), timeout=2000)
    tap(page, right)


def answer_current(page):
    board = page.get_by_test_id("match-board")
    if board.count() > 0 and board.first.is_visible():
        pair_ids = page.locator('[data-match-side="left"]').evaluate_all("els => els.map(el => el.dataset.pairId)")
        assert len(pair_ids) == 3, f"Expected three matching pairs, found {pair_ids}"
        for pair_id in pair_ids:
            tap_match_pair(page, pair_id)
    else:
        tap(page, page.locator("button[data-correct='true']").first)
    page.wait_for_selector("[data-testid=answer-feedback]")


def finish_diagnostic(page):
    for index in range(8):
        answer_current(page)
        tap(page, page.get_by_role("button", name="下一题"))
        if index < 7:
            page.wait_for_selector("[data-testid=question-prompt]")


def unlock_after_reload(page):
    page.wait_for_selector("text=输入家长密码")
    page.get_by_label("家长密码").fill("2468")
    tap(page, page.get_by_role("button", name="打开家庭学习区"))
    page.wait_for_selector("text=今天谁来学习？")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1024, "height": 768}, has_touch=True, device_scale_factor=1)
    page = context.new_page()
    errors = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)

    page.goto(BASE_URL, wait_until="networkidle")
    setup_family(page)
    add_first_child(page, "小星")
    tap(page, page.locator("button[aria-label='小星的学习档案']"))
    assert page.get_by_text("豆豆还差 10 颗成长星").is_visible()
    assert_clean_layout(page, "iPad child home with companion card")
    page.screenshot(path=str(OUT / "17-ipad-child-home-companion.png"), full_page=True)

    tap(page, page.get_by_role("button", name="数学 Math"))
    page.wait_for_selector("[data-testid=question-prompt]")
    finish_diagnostic(page)
    assert page.get_by_text("+2 颗成长星").is_visible()
    assert page.get_by_text("现在一共有 2 颗成长星").is_visible()
    assert_clean_layout(page, "iPad result reward")
    page.screenshot(path=str(OUT / "18-ipad-result-growth-star.png"), full_page=True)

    tap(page, page.get_by_role("button", name="回到学习区"))
    assert page.get_by_text("已有 2 颗成长星").is_visible()

    # Browser-only fixture for the second day threshold: preserve the real UI and storage shape.
    page.evaluate("""
      async () => {
        const storage = await import('/src/lib/storage.ts');
        const result = storage.readHousehold();
        let household;
        if (result.status === 'encrypted') household = (await storage.unlockEncryptedHousehold(result.envelope, '2468')).household;
        else if (result.status === 'ok') household = result.household;
        else throw new Error('No household fixture available');
        household.children[0].rewards.lifetimeStars = 10;
        const saved = storage.saveHousehold(household);
        if (!saved.ok) throw new Error(saved.error);
      }
    """)
    page.reload(wait_until="networkidle")
    unlock_after_reload(page)
    tap(page, page.locator("button[aria-label='小星的学习档案']"))
    assert page.get_by_text("豆豆可以兑换了").is_visible()
    tap(page, page.get_by_role("button", name="打开伙伴兑换商城"))
    page.wait_for_selector("text=伙伴兑换商城")
    assert page.get_by_text("已有 10 颗成长星").is_visible()
    assert_clean_layout(page, "iPad companion shop redeemable")
    page.screenshot(path=str(OUT / "19-ipad-companion-shop-redeemable.png"), full_page=True)

    tap(page, page.get_by_role("button", name="兑换"))
    assert page.get_by_text(re.compile("成长星不会扣除")).is_visible()
    page.screenshot(path=str(OUT / "20-ipad-companion-redeem-confirm.png"), full_page=True)
    tap(page, page.get_by_role("button", name="确认兑换"))
    page.get_by_role("button", name="让豆豆陪我").wait_for(state="visible")
    tap(page, page.get_by_role("button", name="让豆豆陪我"))
    page.get_by_text("正在陪伴").wait_for(state="visible")
    assert_clean_layout(page, "iPad companion shop owned and active")
    page.screenshot(path=str(OUT / "21-ipad-companion-owned-active.png"), full_page=True)

    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(200)
    assert_clean_layout(page, "iPhone companion shop")
    page.screenshot(path=str(OUT / "22-iphone-companion-shop.png"), full_page=True)

    page.set_viewport_size({"width": 1280, "height": 800})
    page.goto(BASE_URL, wait_until="networkidle")
    unlock_after_reload(page)
    tap(page, page.locator("button[aria-label='小星的学习档案']"))
    assert_clean_layout(page, "Android tablet active companion home")
    page.screenshot(path=str(OUT / "23-android-tablet-companion-home.png"), full_page=True)

    assert not errors, f"console errors: {errors}"
    print("Reward flow passed: touch completion, +2 stars, home card, shop, confirm, redeem, active companion, responsive layouts.")
    context.close()
    browser.close()
