from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(1000)

    # Click Known LKW
    page.locator('button:has-text("Known LKW")').click()
    page.wait_for_timeout(500)

    # Input recent time to make patient eligible for TNK
    page.fill('input[type="date"]', "2024-01-01")
    page.wait_for_timeout(500)
    page.fill('input[type="time"]', "12:00")
    page.wait_for_timeout(500)

    # Check absolute contraindication (e.g., Active internal bleeding)
    # Scroll down to Medical History / Current Condition to trigger it

    # We will just evaluate JS to set the state and see the banner
    page.evaluate('''
        () => {
            const absoluteCondition = { id: 'active-bleeding', label: 'Active internal bleeding' };
            const relativeCondition = { id: 'pregnancy', label: 'Pregnancy' };
            // Let's just create elements that look like the output for demonstration
            // Actually, we can just select the options from the UI if we find them
        }
    ''')

    # Check Aspirin which might trigger something, or fill out fields to trigger TNK section
    # Better yet, let's use JS to click checkboxes since it worked previously with labels
    page.evaluate('''
        () => {
            const labels = Array.from(document.querySelectorAll('label'));

            // Set Diagnosis to 'Ischemic Stroke'
            const selects = Array.from(document.querySelectorAll('select'));
            for (const select of selects) {
                if (select.options[0] && select.options[0].text.includes('Diagnosis')) {
                    select.value = 'ischemic-stroke';
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }

            // Set Symptoms to something
            const textareas = Array.from(document.querySelectorAll('textarea'));
            if(textareas[0]) {
                textareas[0].value = 'Weakness';
                textareas[0].dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Trigger TNK contraindications by checking some conditions
            // Since we don't have direct state access easily, let's look for known labels
            for (const label of labels) {
                if (label.textContent.includes('Active internal bleeding')) {
                    label.click();
                }
                if (label.textContent.includes('Pregnancy')) {
                    label.click();
                }
            }

            // Scroll to the bottom to see recommendations
            window.scrollTo(0, document.body.scrollHeight);
        }
    ''')
    page.wait_for_timeout(2000)

    # Let's take the screenshot
    page.screenshot(path="/home/jules/verification/screenshots/verification_final.png", full_page=True)
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    import os
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
