# Excel 仕様書・サンプルの閲覧用ドキュメント

エクセルファイル（.xlsx）はバイナリのため、このフォルダには **Markdown に変換した内容** を格納しています。  
エディタや GitHub 上でそのまま閲覧・検索できます。

## ファイル一覧

| 元のExcelファイル | 変換後のMarkdown | 説明 |
|-------------------|------------------|------|
| `OIC Tech Spec Item Import Template Specification 20260116.xlsx` | [OIC_Tech_Spec_Item_Import_Template_Specification_20260116.md](./OIC_Tech_Spec_Item_Import_Template_Specification_20260116.md) | インポートフォーマット仕様書（マッピング・Item Import Export 等） |
| `Item_260306 0906 (1).xlsx` | [Item_260306_0906_sample.md](./Item_260306_0906_sample.md) | 実際のインポートファイルのサンプル（Item / Additional Barcode シート） |

## 再変換の方法

元の Excel を更新した場合は、以下で Markdown を再生成できます。

```powershell
cd "c:\Users\s.hattori\git-projects\create_item_import_system"
python scripts/read_excel_to_md.py
```

※ `openpyxl` が必要です: `pip install openpyxl`

## 仕様書の主なシート（OIC Tech Spec）

- **Mapping from Original Template** … 元テンプレートからインポート項目へのマッピング
- **Item Import Export** … Item / Additional Barcode 等の項目定義・データ型・エラー処理・テストデータ

## サンプルの主なシート（Item_260306）

- **Item** … 商品マスタ（Department Code, Product Group Code, Barcode, Description, Unit Cost, Unit Price 等）
- **Additional Barcode** … 追加バーコード（Base Barcode No., Barcode Unit of Measure, Qty per Unit, Unit Cost, Unit Price 等）
