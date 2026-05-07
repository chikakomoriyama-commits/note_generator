document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('generatorForm');
    const generateBtn = document.getElementById('generateBtn');
    const btnText = form.querySelector('.btn-text');
    const loader = document.getElementById('loader');
    const resultArea = document.getElementById('resultArea');
    const copyBtn = document.getElementById('copyBtn');
    const errorMessage = document.getElementById('errorMessage');

    const venueRadios = document.querySelectorAll('input[name="venue"]');
    const linkInput = document.getElementById('link');
    const TOKYO_VENUE_LINK = "https://forms.gle/BA9whvZjf8sfuML7A";
    let previousZoomLink = "";

    venueRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === '都内会場') {
                if (linkInput.value !== TOKYO_VENUE_LINK) {
                    previousZoomLink = linkInput.value;
                }
                linkInput.value = TOKYO_VENUE_LINK;
                linkInput.readOnly = true;
                linkInput.style.backgroundColor = 'var(--input-bg)';
                linkInput.style.color = 'var(--text-muted)';
                linkInput.style.opacity = '0.7';
            } else {
                linkInput.value = previousZoomLink;
                linkInput.readOnly = false;
                linkInput.style.backgroundColor = '';
                linkInput.style.color = '';
                linkInput.style.opacity = '';
            }
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get values
        const apiKey = document.getElementById('apiKey').value.trim();
        const modelName = document.getElementById('modelName').value.trim();
        const month = document.getElementById('month').value.trim();
        const theme1 = document.getElementById('theme1').value.trim();
        const theme2 = document.getElementById('theme2').value.trim();
        const datetime = document.getElementById('datetime').value.trim();
        const venue = document.querySelector('input[name="venue"]:checked').value;
        const link = document.getElementById('link').value.trim();

        if (!apiKey) {
            showError('APIキーを入力してください。');
            return;
        }

        // Setup UI for loading
        setLoading(true);
        hideError();
        resultArea.value = '';
        resultArea.disabled = true;
        copyBtn.disabled = true;

        const themeCount = theme2 ? 2 : 1;

        const systemPrompt = `あなたはプロのライターです。以下の情報をもとに、指定されたフォーマットに厳密に従って告知文を生成してください。
前置きや解説などは一切出力せず、告知文のテキストのみを出力してください。
各テーマの紹介文は、読者が参加したくなるような魅力的な内容で、100字程度で記述してください。

【情報】
- 月: ${month}
- テーマ数: ${themeCount}
- テーマ1: ${theme1}
${theme2 ? `- テーマ2: ${theme2}` : ''}
- 日時: ${datetime}
- 会場: ${venue}
- 申込みリンク: ${link}

【指定フォーマット】
今月の創造プロセス倶楽部は${themeCount}つのテーマでお届けします。

ひとつは、[テーマ1の100字程度の紹介文]
${theme2 ? '\nもうひとつは、[テーマ2の100字程度の紹介文]\n' : ''}
お楽しみに！

・日　時：${datetime}
・参加費：3,000円
・会　場：${venue}
・申込み：${link}`;

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey: apiKey,
                    modelName: modelName,
                    systemPrompt: systemPrompt
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("API Error:", data);
                if (data.error) {
                    throw new Error(`【詳細エラー】\nタイプ: ${data.error.type}\nメッセージ: ${data.error.message}\n(※この画面全体をコピーして教えてください)`);
                }
                throw new Error('APIリクエストに失敗しました。APIキーが正しいか確認してください。');
            }

            const generatedText = data.content[0].text;
            
            // Display result
            resultArea.value = generatedText;
            resultArea.disabled = false;
            copyBtn.disabled = false;

        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    });

    copyBtn.addEventListener('click', async () => {
        if (!resultArea.value) return;
        
        try {
            await navigator.clipboard.writeText(resultArea.value);
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span class="icon">✅</span> コピーしました！';
            copyBtn.style.borderColor = '#10b981';
            copyBtn.style.color = '#10b981';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.borderColor = '';
                copyBtn.style.color = '';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showError('クリップボードへのコピーに失敗しました。手動でコピーしてください。');
        }
    });

    function setLoading(isLoading) {
        if (isLoading) {
            btnText.style.display = 'none';
            loader.style.display = 'block';
            generateBtn.disabled = true;
        } else {
            btnText.style.display = 'block';
            loader.style.display = 'none';
            generateBtn.disabled = false;
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }
});
