/**
 * GenAI（Gemini）による分類コード推測
 * 商品名（英・泰）とマスタ一覧を渡し、最も適切な分類コードを1件返す
 */
import { GoogleGenAI } from '@google/genai/web';

const GEMINI_API_KEY = typeof import.meta.env?.VITE_GEMINI_API_KEY === 'string'
  ? import.meta.env.VITE_GEMINI_API_KEY.trim()
  : '';

const MODEL = 'gemini-2.5-flash';

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
 * GenAI で分類を推測する。API キーが未設定または失敗時は null を返す。
 * @param {string} nameEng - 商品名（英語）
 * @param {string} nameTha - 商品名（タイ語）
 * @param {Array<{productGroupCode, description?, descriptionTha?}>} groupMasterList - 分類マスタ配列
 * @returns {Promise<{productGroupCode, description?, descriptionTha?}|null>} マスタに存在する場合のみ該当1件、それ以外は null
 */
export async function suggestClassificationWithGenAI(nameEng, nameTha, groupMasterList) {
  if (!GEMINI_API_KEY) return null;
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
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    const raw = (response?.text ?? response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
    const codes = groupMasterList.map((r) => String(r.productGroupCode || '').trim()).filter(Boolean);
    // 応答文中にマスタのコードが含まれるか検索（長いコードから試して部分一致を避ける）
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
  return Boolean(GEMINI_API_KEY);
}
