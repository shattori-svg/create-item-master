/**
 * GenAI（Gemini）による分類コード推測
 * サーバーサイドプロキシ（/api/ai-suggest）経由で呼び出す
 */

/**
 * 分類マスタをプロンプト用のテキストに整形（1行1件: CODE\t説明）
 */
function formatGroupList(groups) {
  if (!Array.isArray(groups) || groups.length === 0) return '';
  return groups
    .map((r) => {
      const code = String(r.productGroupCode || '').trim();
      const descEn = String(r.description || '').trim();
      const descTha = String(r.descriptionTha || '').trim();
      const desc = [descEn, descTha].filter(Boolean).join(' / ');
      return `${code}\t${desc}`;
    })
    .join('\n');
}

/**
 * GenAI で分類を推測する。サーバーが未設定または失敗時は null を返す。
 * @param {string} nameEng - 商品名（英語）
 * @param {string} nameTha - 商品名（タイ語）
 * @param {Array<{productGroupCode, description?, descriptionTha?}>} groupMasterList - 分類マスタ配列
 * @returns {Promise<{productGroupCode, description?, descriptionTha?}|null>}
 */
export async function suggestClassificationWithGenAI(nameEng, nameTha, groupMasterList) {
  const text = [nameEng, nameTha].filter(Boolean).join(' ');
  if (!text.trim()) return null;
  if (!Array.isArray(groupMasterList) || groupMasterList.length === 0) return null;

  const listText = formatGroupList(groupMasterList);
  const prompt = `You are a retail product classification expert. Given a product name, select the ONE product group code that best matches the product's category (e.g. coffee, snacks, dairy, beverage).

Product name (English): ${nameEng || '(none)'}
Product name (Thai): ${nameTha || '(none)'}

Valid codes and their category descriptions (format: CODE[TAB]description). You must reply with exactly one code from this list:
${listText}

Rules:
- Reply with ONLY the product group code (e.g. 110113001). No explanation, no period, no other text.
- Choose the category that best fits what the product is (product type), not just partial word match.
- If the product could fit multiple categories, pick the most specific match.`;

  try {
    const res = await fetch('/api/ai-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = (data.text ?? '').trim();
    const codes = groupMasterList.map((r) => String(r.productGroupCode || '').trim()).filter(Boolean);
    const sortedCodes = [...new Set(codes)].sort((a, b) => b.length - a.length);
    let code = null;
    for (const c of sortedCodes) {
      if (raw.includes(c)) {
        code = c;
        break;
      }
    }
    if (!code) return null;
    return groupMasterList.find((r) => String(r.productGroupCode || '').trim() === code) || null;
  } catch (err) {
    console.warn('GenAI suggest failed:', err);
    return null;
  }
}

export function hasGenAIConfig() {
  // サーバー側設定なので常に試みる（503が返れば未設定と判断）
  return true;
}
