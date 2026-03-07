# OIC Tech Spec Item Import Template Specification 20260116.xlsx

元ファイル: `OIC Tech Spec Item Import Template Specification 20260116.xlsx`


## シート: Mapping from Original Template

|  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Item Import Template　Type |  | Import Template　Field （To Be） | Data Type | Import Template Type | Sheet Name | Field Name | Remarks | Import Template Field (Cactoz Original) |  | Test Data | LOPIA Cola 500ml |  |  |
| Item |  |  |  |  |  |  |  |  |  |  | 2 |  |  |
|  |  | Product Group Code | list | Item | Item | Product Group Code |  | Y |  |  | 110101001 |  |  |
|  |  | No. | Char | Item | Item | Item No. |  | Y |  |  | 1+999999 |  |  |
|  |  | Description | Char | Item | Item | Description (THA) |  | Y |  |  | LOPIA Cola 500ml |  |  |
|  |  | POS Description | Char | Item | Item | POS Description (THA) |  | Y |  |  |  |  |  |
|  |  | Label Description | Char | Item | Food Information | Label Description (THA) | May change based on Shelf Label Requirement. | Y |  |  |  |  |  |
|  |  | Base Unit of Measure | list | Item | Item | Base Unit of Measure |  | Y |  |  | PCS |  |  |
|  |  | Costing Method | list | Item | Item | Inventory Type | Drop the costing method and change it to "Inventory Type"
- If type = Inventory, costing method = Average
- If type = Non-Inventory, costing method = FIFO(not used) | Y |  |  | Average |  |  |
|  |  | VAT Prod. Posting Group | list | Item | Item | - | Dropped

The value should be default based on Gen. Prod. Posting Group. Item should insert with "VAT-07" tax posting group as long it is sell on the POS.

The may be possibility of purchase 0 VAT from the supplier (rare case), this can be set on the Purchase Order level. | Y |  |  | VAT07 |  |  |
|  |  | Gen. Prod. Posting Group | list | Item | Item | Gen. Prod. Posting Group |  | Y |  |  | OUTLIGHT |  |  |
|  |  | Inventory Posting Group | list | Item | Item | Inventory Posting Group |  | Y |  |  | OUTLIGHT |  |  |
|  |  | Keying in Price | list | Item | Item | Keying in Price |  | Y |  |  | Not Mandatory |  |  |
|  |  | Keying in Quantity | list | Item | Item | Keying in Quantity |  | Y |  |  | Not Mandatory |  |  |
|  |  | Zero Price Valid | Boolean | Item | Item | Zero Price Valid |  | Y |  |  | 0 |  |  |
|  |  | No Discount Allowed | Boolean | Item | Item | No Discount Allowed |  | Y |  |  | 0 |  |  |
|  |  | Blocked | Boolean | Item | Item | Blocked |  | Y |  |  | 0 |  |  |
|  | ※The items highlighted in yellow below are mandatory for data import. |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Manufacturer name (Thai) | Char | Item | Item | Manufacturer Name (THA) |  | N |  |  | บริษัท แอล ฟู๊ดส์ จำกัด |  |  |
|  |  | Manufacturer name (English) | Char | Item | Item | Manufacturer Name (ENG) |  | N |  |  | L Foods Co., Ltd. |  |  |
|  |  | Item Name （English） | Char | Item | Item | Description (ENG) | The default language for Thailand is Thai language, we will update the remarks as Item Name (Eng) | N |  |  | โลเปีย　โคล่า 500 มล. |  |  |
|  |  | Storage Temerature | list | Item | Food Information | Storage Temperature |  | N |  |  | Room temperature |  |  |
|  |  | Storage Method (Thai) | Char | Item | Food Information | Storage Method (THA) |  | N |  |  | กรุณาเก็บให้พ้นแสงแดดโดยตรง |  |  |
|  |  | Storage Method (English) | Char | Item | Food Information | Storage Method (ENG) |  | N |  |  | Please store away from direct sunlight. |  |  |
|  |  | Coutry of Origin(Thai) | Char | Item | Item | Country of Origin (THA) |  | N |  |  | ไทย |  |  |
|  |  | Coutry of Origin(English) | Char | Item | Item | Country of Origin (ENG) |  | N |  |  | Thailand |  |  |
|  |  | Allergen Grains containing gluten | Y/N | Item | Food Information | Allergen Gluten | original name is too long for the Table field name | N |  |  | N |  |  |
|  |  | Allergen Crustaceans | Y/N | Item | Food Information | Allergen Crustaceans | original name is too long for the Table field name | N |  |  | N |  |  |
|  |  | Allergen Mollusks / Shellfish and their product | Y/N | Item | Food Information | Allergen Mollusks | original name is too long for the Table field name | N |  |  | N |  |  |
|  |  | Allergen Eggs and egg products | Y/N | Item | Food Information | Allergen Eggs | original name is too long for the Table field name | N |  |  | N |  |  |
|  |  | Allergen Fish and fish products | Y/N | Item | Food Information | Allergen Fish | original name is too long for the Table field name | N |  |  | N |  |  |
|  |  | Allergen Peanuts and peanut products | Y/N | Item | Food Information | Allergen Peanuts | original name is too long for the Table field name | N |  |  | N |  |  |
|  |  | Allergen Soybeans and soybean products | Y/N | Item | Food Information | Allergen Soybeans | original name is too long for the Table field name | N |  |  | N |  |  |
|  |  | Allergen Milk and dairy products | Y/N | Item | Food Information | Allergen Dairy | original name is too long for the Table field name | N |  |  | N |  |  |
|  |  | Allergen Tree nuts (e.g. walnut, almond, pecan, etc.) | Y/N | Item | Food Information | Allergen Tree Nuts | original name is too long for the Table field name | N |  |  | N |  |  |
|  |  | Allergen Sulfites — when present at levels ≥ 10 mg/kg | Y/N | Item | Food Information | Allergen Sulfites | original name is too long for the Table field name | N |  |  | N |  |  |
|  |  | Allergen Remarks (English) | Char |  |  |  | String will be concatenate based on the above Allergen Boolean fields | N |  |  | No known major allergens |  |  |
|  |  | Allergen Remarks (Thai) | Char |  |  |  | String will be concatenate based on the above Allergen Boolean fields | N |  |  | ไม่มีสารก่อภูมิแพ้ที่สำคัญ |  |  |
|  | ※Even if the following items cannot be imported in the worst case, it will still be fine for the opening of Store #1. |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Manufacturer name (Japanese) | Char | Item | Item | Manufacturer Name (JPN) |  |  |  |  | 日本L食品株式会社 |  |  |
|  |  | Item Name （Japanese） | Char | Item | Item | Description (JPN) |  |  |  |  | コーラ 500ml |  |  |
|  |  | Brand Name（Thai) | Char | Item | Item | Brand (THA) |  |  |  |  | โลเปีย　โคล่า |  |  |
|  |  | Brand Name（English) | Char | Item | Item | Brand (ENG) |  |  |  |  | LOPIA COLA |  |  |
|  |  | Brand Name（Japanese) | Char | Item | Item | Brand (JPN) |  |  |  |  | ロピアコーラ |  |  |
|  |  | Expiration Date (days) | Number | Item | Food Information | Expiration Days |  |  |  |  | 390 |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Barcode |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | ※Revise to support for the additional barcode only |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | No. |  | Item | Additional Barcode | Base Barcode No. | Instead to let supplier to import with the item number, they can give the base barcode no. |  |  |  | 1+999999 |  |  |
|  |  | Description |  | Item | Additional Barcode | Barcode Description (THA) |  |  |  |  | LOPIA Cola 500ml |  |  |
|  |  | Base Unit of Measure |  | - | - | - | Obsoleted |  |  |  | PCS |  |  |
|  |  | Barcode |  | Item | Additional Barcode | Barcode No. |  |  |  |  | 4901230000020 |  |  |
|  |  | Barcode Unit of Measure |  | Item | Additional Barcode | Barcode Unit of Measure |  |  |  |  | PCS |  |  |
|  |  | Barcode Description |  | - | - | - | Obsoleted |  |  |  | Cola 500ml |  |  |
|  |  | Barcode POS Description |  | Item | Additional Barcode | Barcode Description (THA) |  |  |  |  | Cola 500ml |  |  |
|  |  | Barcode Label Description |  | - | - | - | Currently need to confirm if it can be shared with the POS description |  |  |  | Cola 500ml |  |  |
|  |  | Qty per Unit of Measure |  | Item | Additional Barcode | Qty per Unit of Measure |  |  |  |  | 1 |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | ※The items highlighted in yellow below are mandatory for data import. |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Barcode Item Name （Thai） | Char | Item | Additional Barcode | Barcode Description (ENG) |  |  |  |  | โคล่า 500 มล. |  |  |
|  |  | Specification(Thai) | Char | Item | Additional Barcode | TBD |  |  |  |  | 500มล. |  |  |
|  |  | Specification(English) | Char | Item | Additional Barcode | TBD |  |  |  |  | 500ml |  |  |
|  |  | Proposed Selling Price(BHT) | Number | Item | Additional Barcode | Unit Price |  |  |  |  | 150 |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | ※Even if the following items cannot be imported in the worst case, it will still be fine for the opening of Store #1. |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Barcode Item Name （Japanese） | Char | Item | Item
Additional Barcode | Barcode Description (JPN) |  |  |  |  | コーラ500ml |  |  |
|  |  | Manufacturer's suggested Retail Price(BHT) | Number |  |  |  | To be Discussed. Not discuss how the value is used and how to store in the system. |  |  |  | 150 |  |  |
|  |  | Barcode Item Size(Width) | Number | Item | Item
Additional Barcode | Width |  |  |  |  | 10 |  |  |
|  |  | Barcode Item Size(Height) | Number | Item | Item
Additional Barcode | Height |  |  |  |  | 4 |  |  |
|  |  | Barcode Item Size(Depth) | Number | Item | Item
Additional Barcode | Length |  |  |  |  | 4 |  |  |
|  |  | Barcode Item Package Size(Width) | Number |  |  |  | To be Discussed (as the package width, height and depth should set on respective barcode for the purchase package) |  |  |  | 20 |  |  |
|  |  | Barcode Item Package Size(Height) | Number |  |  |  | To be Discussed (as the package width, height and depth should set on respective barcode for the purchase package) |  |  |  | 16 |  |  |
|  |  | Barcode Item Package Size(Depth) | Number |  |  |  | To be Discussed (as the package width, height and depth should set on respective barcode for the purchase package) |  |  |  | 36 |  |  |
|  |  | Product Weight (kg) | Number | Item | Item
Additional Barcode |  |  |  |  |  | 0.3 |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Sales List |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | No. | Y | - | - | - | Instead to let supplier to import with the item number, they can give the barcode no. |  |  |  | 1+999999 |  |  |
|  |  | Description | Y | - | - | - |  |  |  |  | LOPIA Cola 500ml |  |  |
|  |  | Barcode | Y | Sales Price | Sales Price | Barcode No. |  |  |  |  | 4901230000020 |  |  |
|  |  | Barcode Description | Y | Sales Price | Sales Price | Barcode Description | For export as informational field only |  |  |  | Cola 500ml |  |  |
|  |  | Unit of Measure | Y | Sales Price | Sales Price | Barcode Unit of Measure | For export as informational field only |  |  |  | PCS |  |  |
|  |  | Store Code | Y | Sales Price | Sales Price | Store No. |  |  |  |  | 1001 |  |  |
|  |  | Unit Price | Y | Sales Price | Sales Price | Unit Price/Weight Price |  |  |  |  | 100 |  |  |
|  |  | Starting Date | Y | Sales Price | Sales Price | Starting Date |  |  |  |  |  |  |  |
|  |  | Ending Date | Y | Sales Price | Sales Price | Ending Date |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | ※The following fields are displayed on the Retail Barcode (Sales) screen, and my understanding is that they should be defined in the import data as well. |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | N/A | N |  |  |  |  |  |  |  | Not Mandatory |  |  |
|  |  | N/A | N |  |  |  |  |  |  |  | Not Mandatory |  |  |
|  |  | N/A | N |  |  |  |  |  |  |  | 0 |  |  |
|  |  | N/A | N |  |  |  |  |  |  |  | 0 |  |  |
|  |  | N/A | N |  |  |  |  |  |  |  | 0 |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Purchase List |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Vendor No | Char | Purchase Price | Purchase Price | Vendor No. |  |  |  |  | 10001 |  |  |
|  |  | Barcode |  | Purchase Price | Purchase Price | Barcode No. |  |  |  |  | 4901230000020 |  |  |
|  |  | Unit Cost | Number | Purchase Price | Purchase Price | Unit Cost |  |  |  |  | 99 |  |  |
|  |  | Staring Date | Date | Purchase Price | Purchase Price | Starting Date |  |  |  |  |  |  |  |
|  |  | Ending Date | Dare | Purchase Price | Purchase Price | Ending Date |  |  |  |  |  |  |  |
|  |  | Minimum Quantity | Number | Purchase Price | Purchase Price | Minimum Quantity |  |  |  |  | 24 |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | ※The items highlighted in yellow below are mandatory for data import. |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Supplier item code | Char | Item | Item | Vendor Item No. (Default) |  | N |  |  | 12345 |  |  |
|  |  | Order Unit | Number | - | - | - | To be discussed what required for this information. 
Additional customization is required if this value will be used for purchasing | N |  |  | 24 |  |  |
|  |  | Delivery Lead Time (Mon) | Number | - | - | - | Setup during Vendor creation. One vendor cannot have different delivery lead time based on item. | N |  |  | 2 |  |  |
|  |  | Delivery Lead Time (Tue) | Number | - | - | - | Setup during Vendor creation. One vendor cannot have different delivery lead time based on item. | N |  |  | 2 |  |  |
|  |  | Delivery Lead Time (Wed) | Number | - | - | - | Setup during Vendor creation. One vendor cannot have different delivery lead time based on item. | N |  |  | 2 |  |  |
|  |  | Delivery Lead Time (Thr) | Number | - | - | - | Setup during Vendor creation. One vendor cannot have different delivery lead time based on item. | N |  |  | 2 |  |  |
|  |  | Delivery Lead Time (Fri) | Number | - | - | - | Setup during Vendor creation. One vendor cannot have different delivery lead time based on item. | N |  |  | 2 |  |  |
|  |  | Delivery Lead Time (Sat) | Number | - | - | - | Setup during Vendor creation. One vendor cannot have different delivery lead time based on item. | N |  |  | 2 |  |  |
|  |  | Delivery Lead Time (Sun) | Number | - | - | - | Setup during Vendor creation. One vendor cannot have different delivery lead time based on item. | N |  |  | 3 |  |  |
|  |  | Importer Name(Thai) | Char | Item | Item | Importer (THA) |  | N |  |  | บริษัท แอล ฟู๊ดส์ จำกัด |  |  |
|  |  | Importer Name(English) | Char | Item | Item | Importer (ENG) |  | N |  |  | L Foods Co., Ltd. |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | ※The following fields are displayed on the Retail Barcode (General) screen, and my understanding is that they will be generated from the import data. |  |  |  |  |  |  |  |  |  |  |  |  |


## シート: Item Import Export

|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Item Import Template　Type | Not Exist | Import Template　Field （To Be） | Data Type | Explanation | Error Handling (Create) | Error Handling (Update) | SOLUM | ISHIDA | LSC Item Screen | OIC Item Template | Shelf Label Conversion Target | ISHIDA Scale Conversion Target | Remarks(Japanese) | Remarks(English) | Test Data | LOPIA Cola 500ml | LOPIA Cola 500ml 6-pack | LOPIA Cola 500ml 24-bottle case | Meiji Yogurt Original 130g | Meiji Yogurt Strawberry 130g | Remy Martin XO 70Cl | Banana bunch  1P | Poteto 1P | Poteto 10P | Poteto BHT/100g | Poteto 2kg 1Case | Meron 1P | Seafood Mix 1P (Manufacturer barcode) | Seafood bowl 1Pack (Store Manufacturing & Pricing) | Shrimp BHT/100g (Store Manufacturing & Pricing) | Sushi 1Pack (PC Manufacturing & Pricing) | Salmon Sashimi 50BHT/100g (PC Manufacturing & Pricing) | Crab BHT per kg (Raw Material from Supplier) | Oyster 2kg 1case (Raw Material from supplier) | Tuna Sashimi 2kg (Intermediate Materials from PC) | Sumeshi BHT per kg (Intermediate Materials from PC) | Wiener 1P | Ground pork 1Pack (Store Manufacturing & Pricing) | Beef Steak BHT/100g (Store Manufacturing & Pricing) | Beef round block BHT per kg (Raw Material from Supplier) | Commercial-use sauce 2L*6 (Raw Material from supplier) | Pudding 1P | Pizza 1Pack (Store Manufacturing & Pricing) | Poteto Salad BHT/100g (Store Manufacturing & Pricing) | Deep fried chicken 1Pack (PC Manufacturing & Pricing) | Japanese mixed salad 50BHT/100g (PC Manufacturing & Pricing) | Commercial-use bacon BHT per kg (Raw Material from Supplier) | Commercial-use salad 1case (Raw Material from supplier) | Pork loin slice bht per kg (Intermediate Materials from PC) |
| Item |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 2 | 2 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 30 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 |
|  |  | Department Code | List | Business Department Code
1. 01
2. 02
3. 03
4. 04
5. 05
6. 06 | 1. Not allow blank | 1. Not allow change value 
(Related to Item Number design) |  |  | Retail Barcode Item Tab | Product Classification |  |  | 現在の取り込みだと小分類になっているが、細分類を設定する　（Retail Barcodeは細分類になっている） | In the current data import, it is mapped to Item Category Code, but we will configure it to Product Category Code instead. (Retail Barcode uses the Product Category Code.) |  | 01 | N/A
(Refer to Additional Barcode) | N/A
(Refer to Additional Barcode) | 01 | 01 | 01 | 2 | 2 | 2 | 2 | 2 | 2 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 4 | 4 | 4 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 |
|  |  | Product Group Code | List | Retail Product Group
(based on master list) | 1. Not allow blank
2. Group must belong to the department
3. Group must exist in the system | 1. Not allow change value
(Related to Department Code) |  |  | Retail Barcode Item Tab | N/A |  |  | 自動採番になるはずでは？移行時はOICで採番することも可能 | It should be automatically generated, shouldn’t it?
During the migration, it is also possible for OIC to generate the numbers. |  | 110101001 | N/A | N/A | 120101001 | 120101001 | 130101001 | 210101001 | 210101001 | 210101001 | 210101001 | 210101001 | 210101001 | 310101001 | 310101001 | 310101001 | 310101001 | 310101002 | 310101001 | 310101001 | 310101001 | 310101001 | 410101001 | 410101001 | 410101001 | 410101001 | 410101001 | 510101001 | 510101001 | 510101001 | 510101001 | 510101001 | 510101001 | 510101001 | 510101001 |
|  |  | Barcode Type | List | Define the Barcode Type
(user must fill in exact values (spelling)
1. Manufacturer
2. PLU
3. Price-Embedded

Manufacturer Barcode Type will not be synced to ISHIDA
All Barcode Type will be synced to Shelf Label | 1.Not allow blank | 1. Not allow change value
(Related to Item Number design) |  | Y | Retail Barcode Barcode Tab | Product Name（English） |  |  |  |  |  | Manufacturer | N/A | N/A | Manufacturer | Manufacturer | Manufacturer | PLU | PLU | Price-Embedded | Price-Embedded | PLU/Manufacturer | PLU/Manufacturer | Manufacturer | Price-Embedded | Price-Embedded | Price-Embedded | Price-Embedded | PLU/Manufacturer | PLU/Manufacturer | PLU/Manufacturer | PLU/Manufacturer | Manufacturer | Price-Embedded | Price-Embedded | PLU/Manufacturer | PLU/Manufacturer | Manufacturer | Price-Embedded | Price-Embedded | Price-Embedded | Price-Embedded | PLU/Manufacturer | PLU/Manufacturer | PLU/Manufacturer |
|  |  | Barcode No. | Text13 | EAN 13 Barcode number | 1. If Barcode Type is Manufacturer, this value cannot be blank
2.If Barcode Type is not Manufacturer, this value must be blank.
3. System will check if the barcode is a EAN 13, UPC-8 or UPC-12 barcode | 1. Not allow change value
2. Barcode must exist in the system | Y | Y | Retail Barcode Barcode Tab | N/A |  |  | これはBarcode単位で不要では？ | Since this will be configured at the barcode level, isn’t this unnecessary? |  | 8851959132012 | N/A | N/A | 8853012701010 | 8853012701027 | 3024480004522 | 2020000010005 | 2020000020002 | 2200001000004 | 2200002000001 | 2020000030009 | 2020000040006 | 8851959132018 | 2300001000000 | 2300002000007 | 2300003000004 | 2300004000001 | 2030000020006 | 2030000030003 | 2030000040000 | 2030000050007 | 8853012701013 | 2400001000008 | 2400002000005 | 2040000020007 | 2040000030004 | 8853012701020 | 3000001000002 | 3000002000009 | 3000003000006 | 3000004000003 | 2050000020008 | 2050000030005 | 2050000040002 |
|  |  | Item No. | Text10 | Item No.
System will automatically generate the item number when a item is imported. User can always export the item to get the item number. | 1. If Item No. is blank, the system will recognize the import as "Creation" | 1.If Item No. is not blank, the system will recognize the import as "Modification"
2. Not allow change value
3. Item must exist in the system |  |  | Retail Barcode | N/A |  |  | これはBarcode単位で不要では？ | Since this will be configured at the barcode level, isn’t this unnecessary? |  | 1000001 | N/A | N/A | 1000002 | 1000003 | 1000004 | 2000001 | 2000002 | 200001 | 200002 | 2000003 | 2000004 | 3000001 | 300001 | 300002 | 300003 | 300004 | 3000002 | 3000003 | 3000004 | 3000005 | 4000001 | 400001 | 400002 | 4000002 | 4000003 | 5000001 | 500001 | 500002 | 500003 | 500004 | 5000002 | 5000003 | 5000004 |
|  |  | Description (ENG) | Text100 | Main Item Description | 1. Standard length check | 1. Standard length check |  |  | Retail Barcode Item Tab | N/A |  |  |  |  |  | Coca-Cola Original Taste 330ml | N/A | N/A | Meiji Yogurt Original 130g | Meiji Yogurt Strawberry 130g | Remy Martin XO 70Cl | Banana bunch  1P | Poteto 1P | Poteto 10P | Poteto BHT/100g | Poteto 2kg 1Case | Meron 1P | Seafood Mix 1P (Manufacturer barcode) | Seafood bowl 1Pack (Store Manufacturing & Pricing) | Shrimp BHT/100g (Store Manufacturing & Pricing) | Sushi 1Pack (PC Manufacturing & Pricing) | Salmon Sashimi 50BHT/100g (PC Manufacturing & Pricing) | Crab BHT per kg (Raw Material from Supplier) | Oyster 2kg 1case (Raw Material from supplier) | Tuna Sashimi 2kg (Intermediate Materials from PC) | Sumeshi BHT per kg (Intermediate Materials from PC) | Wiener 1P | Ground pork 1Pack (Store Manufacturing & Pricing) | Beef Steak BHT/100g (Store Manufacturing & Pricing) | Beef round block BHT per kg (Raw Material from Supplier) | Commercial-use sauce 2L*6 (Raw Material from supplier) | Pudding 1P | Pizza 1Pack (Store Manufacturing & Pricing) | Poteto Salad BHT/100g (Store Manufacturing & Pricing) | Deep fried chicken 1Pack (PC Manufacturing & Pricing) | Japanese mixed salad 50BHT/100g (PC Manufacturing & Pricing) | Commercial-use bacon BHT per kg (Raw Material from Supplier) | Commercial-use salad 1case (Raw Material from supplier) | Pork loin slice bht per kg (Intermediate Materials from PC) |
|  |  | Description (THA) | Text100 | Item Description in Thai | 1. Standard length check | 1. Standard length check |  |  | Retail Barcode Item Tab | N/A |  |  | メーカーバーコード商品はAverageで、原材料やCK製造・店内加工など非バーコード商品はSTANDARDを設定 | For products with manufacturer barcodes, we are using Average costing, and for non-barcode items such as raw materials, CK production, and in-store processed items, we are using Standard. Is my understanding correct? |  | โคล่า 330 มล. | N/A | N/A |  |  |  | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | Description (JPN) | Text100 | Item Description in Japanese | 1. Standard length check | 1. Standard length check |  |  | Retail Barcode Item Tab | Tax Classification |  |  |  |  |  | xxxxxxx | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | POS Description (ENG) | Text30 | POS/Receipt Description | 1. Standard length check
2. Allow Blank and will copy from description (but system will trim the description to maximum 30 characters) | 1. Blank will not perform any modification |  |  | Retail Barcode Barcode Tab | N/A |  |  |  |  |  | Coca-Cola Original Taste 330ml | N/A | N/A | Meiji Yogurt Original 130g | Meiji Yogurt Strawberry 130g | Remy Martin XO 70Cl | Banana bunch  1P | Poteto 1P | Poteto 10P | Poteto BHT/100g | Poteto 2kg 1Case | Meron 1P | Seafood Mix 1P | Seafood bowl 1Pack (Store Manu | Shrimp BHT/100g (Store Manufac | Sushi 1Pack (PC Manufacturing | Salmon Sashimi 50BHT/100g (PC | Crab BHT per kg (Raw Material | Oyster 2kg 1case (Raw Material | Tuna Sashimi 2kg (Intermediate | Sumeshi BHT per kg (Intermedia | Wiener 1P | Ground pork 1Pack (Store Manuf | Beef Steak BHT/100g (Store Man | Beef round block BHT per kg (R | Commercial-use sauce 2L*6 (Raw | Pudding 1P | Pizza 1Pack (Store Manufacturi | Poteto Salad BHT/100g (Store M | Deep fried chicken 1Pack (PC Ma | Japanese mixed salad 50BHT/100 | Commercial-use bacon BHT per k | Commercial-use salad 1case (Ra | Pork loin slice bht per kg (In |
|  |  | POS Description (THA) | Text30 | POS/Receipt Description in Thai | 1. Standard length check
2. Allow Blank and will copy from description (but system will trim the description to maximum 30 characters) | 1. Blank will not perform any modification |  |  | Retail Barcode Barcode Tab | N/A |  |  | メーカーバーコード商品はAverageで、原材料やCK製造・店内加工など非バーコード商品はSTANDARDを設定 | For products with manufacturer barcodes, we are using Average costing, and for non-barcode items such as raw materials, CK production, and in-store processed items, we are using Standard. Is my understanding correct? |  | โคล่า 330 มล. | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | POS Description (JPN) | Text30 | POS/Receipt Description in Japanese | 1. Standard length check
2. Allow Blank and will copy from description (but system will trim the description to maximum 30 characters) | 1. Blank will not perform any modification |  |  | Retail Barcode Barcode Tab | Tax Classification |  |  |  |  |  | xxxxxxx | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | Base Unit of Measure | List | Base Unit of Measure | 1. For TRADE, TRADE-NON, FINISHED-CK/PC, FINISHED-INSTORE, STORE posting group can fill in as "PCS","100G" or "CTN" only
2. For MATERIAL can fill in with "PCS" or "100G" based on Accounting Cost design | 1. Not allow change value
(Related to Base Unit of Measure, Inventory Type and Posting Groups) |  |  | Retail Barcode Item Tab | Item Type |  |  | テンプレートでは、INHOUSE,TRADE,SERVICEだが変更、メーカーバーコードがOUTLIGHT、店舗加工・CK製造商品がPRODUCE、原材料がRAWMATERIAL、消耗品がSUPPLY 食品以外で販売する商品（ショッピングバック）はOUTLIGHTでいい？ | In the template, the item types are INHOUSE, TRADE, and SERVICE, but we will change them as follows:
Manufacturer-barcode items → OUTLIGHT
In-store processed / CK production items → PRODUCE
Raw materials → RAWMATERIAL
Consumables → SUPPLY

For non-food items sold in the store (such as shopping bags), should we also categorize them as OUTLIGHT? |  | PCS | N/A | N/A | PCS | PCS | PCS | PCS | PCS | PCS | PCS | PCS | PCS | PCS | PCS | PCS | PCS | PCS | 100G | PCS | PCS | 100G | PCS | PCS | PCS | 100G | PCS | PCS | PCS | PCS | PCS | PCS | 100G | PCS | 100G |
|  |  | Size Specification (ENG) | Text50 | Main Base Unit of Measure description | 1. Allow Blank |  | Y |  | Retail Barcode's Item Unit of Measure |  |  |  |  |  |  | 500ml | N/A | N/A |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Size Specification (THA) | Text50 | Base Unit of Measure description in Thai | 1. Allow Blank |  | Y |  | Retail Barcode's Item Unit of Measure |  |  |  |  |  |  | 500มล. | N/A | N/A |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Size Specification (JPN) | Text50 | Base Unit of Measure description in Japanese | 1. Allow Blank |  |  |  | Retail Barcode's Item Unit of Measure |  |  |  |  |  |  |  | N/A | N/A |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Width | Decimal | Base Unit of Measure Width | 1. Allow Blank, return 0 |  | Y |  | Retail Barcode's Item Unit of Measure |  |  |  |  |  |  | 10 | N/A | N/A |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Height | Decimal | Base Unit of Measure Height | 1. Allow Blank, return 0 |  | Y |  | Retail Barcode's Item Unit of Measure |  |  |  |  |  |  | 4 | N/A | N/A |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Length | Decimal | Base Unit of Measure Length/Depth | 1. Allow Blank, return 0 |  | Y |  | Retail Barcode's Item Unit of Measure |  |  |  |  |  |  | 4 | N/A | N/A |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Weight | Decimal | Product Weight (kg) | 1. Allow Blank, return 0 |  | Y |  | Retail Barcode's Item Unit of Measure |  |  |  |  |  |  | 0.3 | N/A | N/A |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Inventory Type | List | Define the Barcode Type
(user must fill in exact values (spelling)
1. Inventory
2. Non-Inventory | 1. Not allow blank
2. If Barcode type = Manufacturer, the value must be Inventory
3. If Barcode type = Price-embedded, the value must be non-Inventory
4. PLU support both inventory and non-inventory | 1. Not allow change value
(Related to Base Unit of Measure, Inventory Type and Posting Groups) |  |  | Retail Barcode Item Tab |  |  |  | 同上 |  |  | Inventory | N/A | N/A | Inventory | Inventory | Inventory | Non-Inventory | Non-Inventory | Non-Inventory | Non-Inventory | Non-Inventory | Non-Inventory | Inventory | Non-Inventory | Non-Inventory | Non-Inventory | Non-Inventory | Non-Inventory | Non-Inventory | Non-Inventory | Non-Inventory | Inventory | Non-Inventory | Non-Inventory | Non-Inventory | Non-Inventory | Inventory | Non-Inventory | Non-Inventory | Non-Inventory | Non-Inventory | Non-Inventory | Non-Inventory | Non-Inventory |
|  |  | Inventory Posting Group | List | Define the Item Posting Group
(user must fill in exact values (spelling)
1. FINISHED-CK/PC
2. FINISHED-INSTORE
3. MATERIAL
4. PACKAGING
5. SEMI-FIN
6. STORE
7. SUPPLIES
8. TRADE
9. TRADE-NON | For Inventory, it is mandatory to define the Item Posting Group
For non-inventory, this can be left blank | 1. Not allow change value
(Related to Base Unit of Measure, Inventory Type and Posting Groups) |  |  | Retail Barcode Item Tab |  |  |  | これはSales Price単位でItemでは不要では？（画面上もSales Price単位で定義されている） | Isn’t this unnecessary at the Item level, since it is managed at the Sales Price level? (It is also defined at the Sales Price level on the screen.) |  | TRADE | N/A | N/A | TRADE | TRADE | TRADE |  |  |  |  |  |  | TRADE |  |  |  |  |  |  |  |  | TRADE |  |  |  |  | TRADE |  |  |  |  |  |  |  |
|  |  | Gen. Prod. Posting Group | List | Define the Item Posting Group
(user must fill in exact values (spelling)
1. FINISHED-CK/PC
2. FINISHED-INSTORE
3. MATERIAL
4. PACKAGING
5. SEMI-FIN
6. STORE
7. SUPPLIES
8. TRADE
9. TRADE-NON |  | 1. Not allow change value
(Related to Base Unit of Measure, Inventory Type and Posting Groups) |  |  | Retail Barcode Item Tab |  |  |  | 同上 | Same as above |  | TRADE | N/A | N/A | TRADE | TRADE | TRADE | TRADE-NON | TRADE-NON | TRADE-NON | TRADE-NON | MATERIAL | MATERIAL | TRADE | TRADE-NON | TRADE-NON | TRADE-NON | TRADE-NON | MATERIAL | MATERIAL | MATERIAL | MATERIAL | TRADE | TRADE-NON | TRADE-NON | MATERIAL | MATERIAL | TRADE | TRADE-NON | TRADE-NON | TRADE-NON | TRADE-NON | MATERIAL | MATERIAL | MATERIAL |
|  |  | Vendor No. (Default) | List | Define the default vendor of the item
(Other supplier price is imported in another template) | 1. Not allow blank for Manufacturer barcode
2. Allowed Blank for PLU and Price-Embedded barcode
3. Vendor must exist in the system | 1. Not allow blank for Manufacturer barcode
2. Allowed Blank for PLU and Price-Embedded barcode
3. Vendor must exist in the system |  |  | Retail Barcode's Purchase Tab |  |  |  | 同上 | Same as above |  | 10001
(บริษัท แอล ฟู๊ดส์ จำกัด/L Foods Co., Ltd.) | N/A | N/A | V10001 | V10001 | V10001 |  |  |  |  | V10001 | V10001 | V10001 |  |  |  |  | V10001 | V10001 | V10001 | V10001 | V10001 |  |  | V10001 | V10001 | V10001 |  |  |  |  | V10001 | V10001 | V10001 |
|  |  | Vendor Item No. (Default) | Text50 | Define the default vendor item number.
(Other supplier price is imported in another template) | 1. Allowed Blank
2. If Barcode type = Manufacturer, must not allowed blank | 1. Allowed Blank |  |  | Retail Barcode's Purchase Tab |  |  |  |  |  |  | 12345 | N/A | N/A |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Unit Cost (Default) | Decimal | Define the default vendor price of the item
(Other supplier price is imported in another template) | 1. Allowed Blank

STORE, FINISHED-INSTORE, FINISHED-CK/PC AND SEMI-FIN
No Vendor required

MATERIAL, SUPPLIES, PACKAGING, TRADE, TRADE-NON
Must have Vendor if Unit Cost is specified (Have validation) | 1. Not Allowed Blank
（Cannot update to zero unit cost) |  |  | Retail Barcode's Purchase Tab |  |  |  | 同上 | Same as above |  | 99 | N/A | N/A | 16 | 16 | 1000 |  |  |  |  | 30 | 30 | 50 |  |  |  |  | 10 | 30 | 30 | 10 | 50 |  |  | 10 | 30 | 50 |  |  |  |  | 10 | 30 | 10 |
|  |  | Auto-Replenishment | Boolean | Define if the Auto-replenishment is enabled for the item.
1. 1 (Yes)
2. 0 (No) | 1. If Yes, the Vendor No cannot be blank
2. applicable for Manufacturer Barcode only | 1. If Yes, the Vendor No cannot be blank |  |  | Retail Barcode's Purchase Tab |  |  |  | 同上 | Same as above |  | Yes | N/A | N/A | Yes | Yes | No | No | No | No | No | No | No | Yes | No | No | No | No | No | No | No | No | Yes | No | No | No | No | Yes | No | No | No | No | No | No | No |
|  |  | Lead Time Calculation  (Default) | Integer | Define if the number of day the item will be delivered. (The number of day will skip the non-working day which is configure at the vendor master. | 1. If Auto-Replenishment is 0, allowed Blank, always return 0
2. If Auto-Replenishment is 1, not allowed Blank | 1. If Auto-Replenishment is 0, allowed Blank, always return 0
2. If Auto-Replenishment is 1, not allowed Blank |  |  | Retail Barcode's Purchase Tab |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Unit Price (Default) | Decimal | Define the default retail price of the item (ALL)
(Store price is imported in another template) | 1. Price cannot be zero unless Zero Price Valid is set to 1
2. Valid for Manufacturer or PLU for TRADE and TRADE-NON | 1. Price cannot be zero unless Zero Price Valid is set to 1 | Y | Y | Retail Barcode's Sales Tab |  |  |  |  |  |  | 100 | N/A | N/A | 22 | 22 | 2000 | 100 | 100 | 100 | 100 |  |  | 100 | 100 | 100 | 100 | 100 |  |  |  |  | 100 | 100 | 100 |  |  | 100 | 100 | 100 | 100 | 100 |  |  |  |
|  |  | Weight Price (Default) | Decimal | Define the default weight price of the item (ALL)
(Store price is imported in another template) | 1. Price cannot be zero unless Zero Price Valid is set to 1
2. Not allow non-zero for Manufacturer and PLU Barcode
3. Not valid for MATERIAL item | 1. Price cannot be zero unless Zero Price Valid is set to 1
2. Not allow non-zero for Manufacturer and PLU Barcode |  | Y | Retail Barcode's Purchase Tab |  |  |  |  |  |  | 0 | N/A | N/A | 0 | 0 | 0 |  |  | 20 | 20 |  |  |  | 20 | 20 | 20 | 20 |  |  |  |  |  | 20 | 20 |  |  |  | 20 | 20 | 20 | 20 |  |  |  |
|  |  | Keying in Price | Boolean | Declare if manual price input is required for sales
1. Blank/0 - Not Mandatory
2. 1 - Must Key in New Price | 1. Allowed Blank | 1. Allowed Blank |  |  | Retail Barcode's Sales Tab |  |  |  |  |  |  | 0 | N/A | N/A | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  | Keying in Quantity | Boolean | Declare if manual quantity input is required for sales
1. Blank/0 - Not Mandatory
2. 1 - Must Key in New Quantity | 1. Allowed Blank | 1. Allowed Blank |  |  | Retail Barcode's Sales Tab |  |  |  |  |  |  | 0 | N/A | N/A | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  | Zero Price Valid | Boolean | Declare if zero price input is valid for sales
1. Blank/No
2. Yes | 1. Allowed Blank | 1. Allowed Blank |  |  | Retail Barcode's Sales Tab |  |  |  |  |  |  | 0 | N/A | N/A | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  | No Discount Allowed | Boolean | Declare if discount is not allowed for the item.
1. Blank/No
2. Yes | 1. Allowed Blank | 1. Allowed Blank |  |  | Retail Barcode's Sales Tab |  |  |  |  |  |  | 0 | N/A | N/A | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  | Blocked | Boolean | Declare if item is blocked
1. Blank/No
2. Yes | 1. Allowed Blank | 1. Allowed Blank |  |  | Retail Item |  |  |  |  |  |  | 0 | N/A | N/A | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  | Country of Origin (ENG) | Text250 | Attribute 1 - required instruction to supplier | 1. Must fill in the value configure in the system. | 1. Must fill in the value configure in the system. | Y |  | Retail Barcode's Item Tab |  |  |  |  |  |  | Thailand | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | Country of Origin (THA) | Text250 | for export only | 1. Allowed Blank |  | Y |  | Attribute |  |  |  |  |  |  | ไทย | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | Country of Origin (JPN) | Text250 | for export only | 1. Allowed Blank |  |  |  | Attribute |  |  |  |  |  |  | xxxxxxx | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | Brand (ENG) | Text250 | Attribute 2 - free text | 1. Allowed Blank |  |  |  | Attribute |  |  |  |  |  |  | LOPIA COLA | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | Brand (THA) | Text250 | Attribute 2 - free text | 1. Allowed Blank |  |  |  | Retail Barcode's Item Tab |  |  |  |  |  |  | โลเปีย　โคล่า | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | Brand (JPN) | Text250 | Attribute 2 - free text | 1. Allowed Blank |  |  |  | Attribute |  |  |  |  |  |  | ロピアコーラ | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | Manufacturer Name (ENG) | Text250 | Attribute 3- free text | 1. Allowed Blank |  | Y |  | Retail Barcode's Item Tab |  |  |  |  |  |  | L Foods Co., Ltd. | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | Manufacturer Name (THA) | Text250 | Attribute 3- free text | 1. Allowed Blank |  | Y |  | Attribute |  |  |  |  |  |  | บริษัท แอล ฟู๊ดส์ จำกัด | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | Manufacturer Name (JPN) | Text250 | Attribute 3- free text | 1. Allowed Blank |  |  |  | Attribute |  |  |  |  |  |  | xxxxxxx | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | Importer (ENG) | Text250 | Attribute 4 - free text | 1. Allowed Blank |  |  |  | Attribute |  |  |  |  |  |  | L Foods Co., Ltd. | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | Importer (THA) | Text250 | Attribute 4 - free text | 1. Allowed Blank |  |  |  | Retail Barcode's Item Tab |  |  |  |  |  |  | บริษัท แอล ฟู๊ดส์ จำกัด | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | Importer (JPN) | Text250 | Attribute 4 - free text | 1. Allowed Blank |  |  |  | Attribute |  |  |  |  |  |  | xxxxxxx | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | Grade (ENG) | Text250 | Attribute 5 - free text | 1. Allowed Blank |  |  |  | Attribute |  |  |  |  |  |  | xxxxxxx | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | Grade (THA) | Text250 | Attribute 5 - free text | 1. Allowed Blank |  |  |  | Retail Barcode's Item Tab |  |  |  |  |  |  | xxxxxxx | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx | xxxxxxx |
|  |  | Grade (JPN) | Text250 | Attribute 5 - free text | 1. Allowed Blank |  |  |  | Attribute |  |  |  |  |  |  | xxxxxxx | N/A | N/A | xxxxxxx | xxxxxxx | xxxxxxx |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Additional Barcode |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ※The additional barcode is not applicable if the base barcode is a PLU or Price-Embedded barcode type |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Barcode No. | Text13 | Barcode No. | 1. If Barcode Type is Manufacturer, this value cannot be blank
2.If Barcode Type is not Manufacturer, this value must be blank.
3. System will check if the barcode is a EAN 13, UPC-8 or UPC-12 barcode | 1. Not allow change value | Y |  | Retail Barcode's Barcode Tab | Item Code |  |  |  |  |  | N/A | 8851959632055 | 8855199141902 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
|  |  | Base Barcode No. | Text13 | Base Barcode No. | 1. Base Barcode No. must exist in the "Item Sheet" or in the system
2. Base Barcode No. must be a manufacturer barcode. | 1. Not allow change value |  |  | Retail Barcode's Item Tab | N/A |  |  |  |  |  | N/A | 8851959132012 | 8851959132012 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
|  |  | Barcode Description (ENG) | Text30 | POS/Receipt Description | 1. Standard length check
2. Allow Blank and will copy from description (but system will trim the description to maximum 30 characters) | 1. Blank will not perform any modification | Y |  | Retail Barcode's Barcode Tab | N/A |  |  |  |  |  | N/A | โคล่า 500 มล. 6 แพ็ค | กล่องโคล่า 500 มล. 24 ขวด | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
|  |  | Barcode Description (THA) | Text30 | POS/Receipt Description in Thai | 1. Standard length check
2. Allow Blank and will copy from description (but system will trim the description to maximum 30 characters) | 1. Blank will not perform any modification | Y |  | Retail Barcode's Barcode Tab | Barcode |  | Y |  |  |  | N/A | LOPIA Cola 500ml 6-pack | LOPIA Cola 500ml 24-bottle case | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
|  |  | Barcode Description (JPN) | Text30 | POS/Receipt Description in Japanese | 1. Standard length check
2. Allow Blank and will copy from description (but system will trim the description to maximum 30 characters) | 1. Blank will not perform any modification |  |  | Retail Barcode's Barcode Tab | Unit of Measure |  |  |  |  |  | N/A | xxxxx | xxxx | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
|  |  | Barcode Unit of Measure | List | Base Unit of Measure | 1. UOM must exist in the system | 1. Not allow change value |  |  | Retail Barcode's Barcode Tab | Product Name(English) |  |  |  |  |  | N/A | PACK6 | CARTON24 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
|  |  | Size Specification (ENG) | Text50 | Main Barcode Unit of Measure description | 1. Allow Blank |  | Y |  | Retail Barcode's Item Unit of Measure |  |  |  |  |  |  | N/A | 500มล.×6 | 500มล.×24 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
|  |  | Size Specification (THA) | Text50 | Barcode Unit of Measure description in Thai | 1. Allow Blank |  | Y |  | Retail Barcode's Item Unit of Measure |  |  |  |  |  |  | N/A | 500ml×6 | 500ml×24 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
|  |  | Size Specification (JPN) | Text50 | Barcode Unit of Measure description in Japanese | 1. Allow Blank |  |  |  | Retail Barcode's Item Unit of Measure |  |  |  |  |  |  | N/A |  |  | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
|  |  | Width | Decimal | Barcode Unit of Measure Width | 1. Allow Blank, return 0 |  | Y |  | Retail Barcode's Item Unit of Measure |  |  |  |  |  |  | N/A | 10 | 20 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
|  |  | Height | Decimal | Barcode Unit of Measure Height | 1. Allow Blank, return 0 |  | Y |  | Retail Barcode's Item Unit of Measure |  |  |  |  |  |  | N/A | 8 | 16 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
|  |  | Length | Decimal | Barcode Unit of Measure Length/Depth | 1. Allow Blank, return 0 |  | Y |  | Retail Barcode's Item Unit of Measure |  |  |  |  |  |  | N/A | 12 | 36 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
|  |  | Weight | Decimal | Product Weight (kg) | 1. Allow Blank, return 0 |  | Y |  | Retail Barcode's Item Unit of Measure |  |  |  |  |  |  | N/A | 1.8 | 7.2 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
|  |  | Qty per Unit of Measure | Decimal | Qty per Unit of Measure | 1. If UOM is equal to "PCS" or "100G", the item barcode |  |  |  | Retail Barcode's Barcode Tab | N/A |  |  |  |  |  | N/A | 6 | 24 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
|  |  | Default Purchase UOM | Integer | Define if this is the default Purchase Unit of Measure (Order Unit) for the item. One item can only have one default purchase unit of measure,
1. 1 (Yes)
2. 0 (No) | 1. Allowed Blank, always return as 0 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Unit Price | Decimal | Define the default retail price of the barcode
(Store price is imported in another template)

can be use for
Proposed Selling Price(BHT)? | 1. At least required either Unit Price or Unit Cost has value more than 0. | 1. At least required either Unit Price or Unit Cost has value more than 0. | Y |  | Retail Barcode's Sales Tab | N/A |  | Y |  |  |  | N/A | 500 | 3000 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
|  |  | Unit Cost | Decimal | Define the default vendor price of the barcode
(Other supplier price is imported in another template) | 1. At least required either Unit Price or Unit Cost has value more than 0. | 1. At least required either Unit Price or Unit Cost has value more than 0. |  |  | Retail Barcode's Purchase Tab | Quantity per UoM |  |  |  |  |  | N/A | 594 | 2376 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| Shelf Label Information |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ※The label information will be support for all barcode types |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Barcode No. | Text13 | Barcode No. | 1.If Barcode Type is not Manufacturer, this value must be blank. |  |  |  | Retail Barcode's Barcode Tab |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Food Registration No. | Text20 | FDA Food Registration No | 1. Allowed Blank |  | Y |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Label Description (ENG) | Text30 | Label Description | 1. Allowed Blank
(Copy from Item Description and Trim at 30 characters) |  | Y |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Label Description (THA) | Text30 | Label Description in Thai | 1. Allowed Blank
(Copy from Item Description and Trim at 30 characters) |  | Y |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Label Description (JPN) | Text30 | Label Description in Japanese | 1. Allowed Blank
(Copy from Item Description and Trim at 30 characters) |  |  |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Storage Temperature | List | Define the Storage Temperature
(user must fill in exact values (spelling)
1. Room Temperature
2. Dry Storage (Avoid Sunlight)	
3. Cold Storage (0–4°C)
4. Frozen Storage (−18°C)
5. Ready-to-Eat/Hot Serving | 1. Allowed Blank, always return as 1 |  | Y |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Storage Method (ENG) | Text58 | Storage Method (ENG) | 1. Allowed Blank |  | Y |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Storage Method (THA) | Text58 | Storage Method (THA) | 1. Allowed Blank |  | Y |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Storage Method (JPN) | Text58 | Storage Method (JPN) | 1. Allowed Blank |  |  | Y | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Allergen Gluten | Boolean | Allergen Gluten
1. Blank/No
2. Yes | 1. Allowed Blank, always return as 1 |  | Y |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Allergen Crustaceans | Boolean | Allergen Crustaceans
1. Blank/No
2. Yes | 1. Allowed Blank, always return as 1 |  | Y |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Allergen Mollusks | Boolean | Allergen Mollusks
1. Blank/No
2. Yes | 1. Allowed Blank, always return as 1 |  | Y |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Allergen Eggs | Boolean | Allergen Eggs
1. Blank/No
2. Yes | 1. Allowed Blank, always return as 1 |  | Y |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Allergen Fish | Boolean | Allergen Fish
1. Blank/No
2. Yes | 1. Allowed Blank, always return as 1 |  | Y |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Allergen Peanuts | Boolean | Allergen Peanuts
1. Blank/No
2. Yes | 1. Allowed Blank, always return as 1 |  | Y |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Allergen Soybeans | Boolean | Allergen Soybeans
1. Blank/No
2. Yes | 1. Allowed Blank, always return as 1 |  | Y |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Allergen Dairy | Boolean | Allergen Dairy
1. Blank/No
2. Yes | 1. Allowed Blank, always return as 1 |  | Y |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Allergen Tree Nuts | Boolean | Allergen Tree Nuts
1. Blank/No
2. Yes | 1. Allowed Blank, always return as 1 |  | Y |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Allergen Sulfites | Boolean | Allergen Sulfites
1. Blank/No
2. Yes | 1. Allowed Blank, always return as 1 |  | Y |  | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Ishida Label Information |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ※The label information will be support for all barcode types |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Barcode No. | Text13 | Barcode No. | 1.If Barcode Type is not Manufacturer, this value must be blank. |  |  |  | Retail Barcode's Barcode Tab |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Ishida PLU No. | Text10 | Ishida PLU No. (Call No.) | 1. Not allowed Blank
2. Always check for uniqueness
3. Only allow numeric digits up to 5 digits only |  |  | Y | Label Information |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Ishida Description (ENG) | Text25 | Ishida Label Description (English) | 1. Allowed Blank
(Copy from Item Description and Trim at 25 characters) |  |  | Y | Label Information |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Ishida Description (THA) | Text28 | Ishida Label Description (Thai) | 1. Allowed Blank
(Copy from Item Description and Trim at 28 characters) |  |  | Y | Label Information |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Ishida Logo No. (Weight) | Text10 | Logo Image ID for Weight Sales Mode | Define the Ishida POP Image ID (Weight Label)
（always leave blank as this information is not required for LSC) | Number of day until expiry |  | Y | Label Information |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Print Packing Date | List | Define the printing option for date
(user must fill in exact values (spelling)
1: No print
2: Pack date
3: Expire date
4: Pack date + Expire date | 1. Allowed Blank, always return as 1 |  |  | Y | Label Information |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Expiration Days | Integer |  | 1. Allowed Blank, always return as 1 |  |  | Y | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Ingredient Line 1 | Text58 | Ingredient Line 1 | 1. Allowed Blank |  |  | Y | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Ingredient Line 2 | Text58 | Ingredient Line 2 | 1. Allowed Blank |  |  | Y | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Ingredient Line 3 | Text58 | Ingredient Line 3 | 1. Allowed Blank |  |  | Y | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Ingredient Line 4 | Text58 | Ingredient Line 4 | 1. Allowed Blank |  |  | Y | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Ingredient Line 5 | Text58 | Ingredient Line 5 | 1. Allowed Blank |  |  | Y | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Ingredient Line 6 | Text58 | Ingredient Line 6 | 1. Allowed Blank |  |  | Y | Label Information |  |  |  |  |  |  | N/A (Optional) | N/A | N/A | N/A (Optional) | N/A (Optional) | N/A (Optional) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |


## シート: Purchase Price Import Export

|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Item Import Template　Type | Not Exist | Import Template　Field （To Be） | Data Type | Explaination | Error Handling (Create) | Error Handling (Update) | Import Template Field (Cactoz Original) | Item Screen | OIC Item Template | Shelf Label Conversion Target | ISHIDA Scale Conversion Target | Remarks(Japanese) | Remarks(English) | Test Data | LOPIA Cola 500ml | LOPIA Cola 500ml 6-pack | LOPIA Cola 500ml 24-bottle case | Banana bunch  1P | Poteto 1P | Poteto 10P | Poteto BHT/100g | Poteto 2kg 1Case | Meron 1P | Seafood Mix 1P (Manufacturer barcode) | Seafood bowl 1Pack (Store Manufacturing & Pricing) | Shrimp BHT/100g (Store Manufacturing & Pricing) | Sushi 1Pack (PC Manufacturing & Pricing) | Salmon Sashimi 50BHT/100g (PC Manufacturing & Pricing) | Crab BHT per kg (Raw Material from Supplier) | Oyster 2kg 1case (Raw Material from supplier) | Tuna Sashimi 2kg (Intermediate Materials from PC) | Sumeshi BHT per kg (Intermediate Materials from PC) | Wiener 1P | Ground pork 1Pack (Store Manufacturing & Pricing) | Beef Steak BHT/100g (Store Manufacturing & Pricing) | Beef round block BHT per kg (Raw Material from Supplier) | Commercial-use sauce 2L*6 (Raw Material from supplier) | Pudding 1P | Pizza 1Pack (Store Manufacturing & Pricing) | Poteto Salad BHT/100g (Store Manufacturing & Pricing) | Deep frid chicken 1Pack (PC Manufacturing & Pricing) | Japanese mixed salad 50BHT/100g (PC Manufacturing & Pricing) | Commercial-use bacon BHT per kg (Raw Material from Supplier) | Commercial-use salad 1case (Raw Material from supplier) | Pork loin slice bht per kg (Intermediate Materials from PC) | Pizza dough 1case(Intermediate Materials from PC) | Mask 1P | Original my basket 1P |
| Purchase List |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Vendor No. | List | Vendor Code | 1. Not allow blank
2. Vendor No. must exist in the system | 1. Not allow blank | Y | Retail Barcode's Purchase Tab |  |  |  | 10001 | 10001 | 10001 | 20001 | N/A | N/A | N/A | 20001 | 20001 | 20001 | N/A | N/A | PC's Location code? | PC's Location code? | 30001 | 30002 | PC's Location code? | PC's Location code? | 40001 | N/A | N/A | 40001 | 40002 | 40001 | N/A | N/A | PC's Location code? | PC's Location code? | 50001 | 50002 | PC's Location code? | PC's Location code? | 60001 | 60002 |  |  |  |
|  |  | Barcode No. | Text13 | Barcode No. (Both Base and Additional Barcode) | 1. Not allow blank
2. Barcode must exist in the system | 1. Not allow blank | Y | Retail Barcode |  |  |  | 4901230000020 | 4901230000030 | 4901230000040 | 4901234200010 | N/A | N/A | N/A | 2+12 Digits(Auto Generated) | 2+12 Digits(Auto Generated) | 4901234200010 | N/A | N/A | 3+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 3+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 3+12 Digits(Auto Generated) | 3+12 Digits(Auto Generated) | 3+12 Digits(Auto Generated) | 3+12 Digits(Auto Generated) | 4901234200010 | N/A | N/A | 4+12 Digits(Auto Generated) | 4+12 Digits(Auto Generated) | 4901234200010 | N/A | N/A | 5+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 5+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 5+12 Digits(Auto Generated) | 5+12 Digits(Auto Generated) | 5+12 Digits(Auto Generated) | 5+12 Digits(Auto Generated) | 4901234200010 | 6+12 Digits(Auto Generated) |  |  |  |
|  |  | Barcode Description | Text30 | Use for Information purpose during item export. 
(No involvement for data modification) | N/A | N/A | Y | Retail Barcode |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Barcode Unit of Measure | List | Use for Information purpose during item export. 
(No involvement for data modification) | N/A | N/A | Y | Retail Barcode |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Vendor Item No. | Text50 | This value is required when there is a new Vendor want to register their vendor item number in the existing barcode
or 
The existing vendor want to change their supplier item number | 1. Not allow blank if vendor is not previously import for the item. | 1. System will update the vendor item no. based on the last barcodes for the same item number | Y | Retail Barcode Vendor page |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Lead Time Calculation | Integer | This value is required when there is a new Vendor want to register their item lead time calculation in the existing barcode
or 
The existing vendor want to change their supplier lead time calculation | 1. Not allow blank if vendor is not previously import for the item. | 1. System will update the vendor lead time based on the last barcodes for the same item number | Y | Retail Barcode Vendor page |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Unit Cost | Decimal | Price based on Barcode Unit of Measure | 1. Not allow zero | 1. Not allow zero | Y | Retail Barcode's Purchase Tab |  |  |  | 99 | 594 | 2376 | 40 | N/A | N/A | N/A | 200 | 200 | 100 | N/A | N/A | 80 | 200 | 1000 | 3000 | 500 | 500 | 100 | N/A | N/A | 1000 | 3000 | 100 | N/A | N/A | 80 | 200 | 1000 | 3000 | 500 | 500 | 40 | 60 |  |  |  |
|  |  | Staring Date | Date | Define if the price has starting date

Default Price
1. If there is any Purchase price with blank starting date and ending date, this will be the default price.

Date Specific Price
2. If there is any Purchase price with either starting date or ending date or both this will be the Date specific price | 1. If system not found any default specific price, system will create one.
2. If system not found any date specific price, system will create one. | 1. Only update the price based on
- Default Price (no value)
- Date Specific Price (with value) | Y | Retail Barcode's Purchase Tab |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Ending Date | Date | Define if the price has ending date

Default Price
1. If there is any Purchase price with blank starting date and ending date, this will be the default price.

Date Specific Price
2. If there is any Purchase price with either starting date or ending date or both this will be the Date specific price | 1. If system not found any default specific price, system will create one.
2. If system not found any date specific price, system will create one.
3. Ending date is not allow if the starting date is blank | 1. Only update the price based on
- Default Price (no value)
- Date Specific Price (with value) | Y | Retail Barcode's Purchase Tab |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Minimum Quantity | Decimal | Define if the price has minimum quantity.

Quantity Specific Price. 
1. If there is any Purchase Price with minimum quantity, the price will reflect if the order quantity is same or more than the minimum quantity. | 1. If system not found any quantity specific date, system will create one. | 1. Only update the price based on
- Quantity Specific Price | Y | Retail Barcode's Purchase Tab |  |  |  | 24 | 4 | 1 | 1 | N/A | N/A | N/A | 1 | 1 | 1 | N/A | N/A | 1 | 1 | 1 | 1 | 1 | 1 | 1 | N/A | N/A | 5 | 1 | 1 | N/A | N/A | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 2 |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |


## シート: Sales Price Import Export

|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Item Import Template　Type | Not Exist | Import Template　Field （To Be） | Data Type | Explaination | Error Handling (Create) | Error Handling (Update) | Import Template Field (Cactoz Original) | Item Screen | OIC Item Template | Shelf Label Conversion Target | ISHIDA Scale Conversion Target | Remarks(Japanese) | Remarks(English) | Test Data | LOPIA Cola 500ml | LOPIA Cola 500ml 6-pack | LOPIA Cola 500ml 24-bottle case | Banana bunch  1P | Poteto 1P | Poteto 10P | Poteto BHT/100g | Poteto 2kg 1Case | Meron 1P | Seafood Mix 1P (Manufacturer barcode) | Seafood bowl 1Pack (Store Manufacturing & Pricing) | Shrimp BHT/100g (Store Manufacturing & Pricing) | Sushi 1Pack (PC Manufacturing & Pricing) | Salmon Sashimi 50BHT/100g (PC Manufacturing & Pricing) | Crab BHT per kg (Raw Material from Supplier) | Oyster 2kg 1case (Raw Material from supplier) | Tuna Sashimi 2kg (Intermediate Materials from PC) | Sumeshi BHT per kg (Intermediate Materials from PC) | Wiener 1P | Ground pork 1Pack (Store Manufacturing & Pricing) | Beef Steak BHT/100g (Store Manufacturing & Pricing) | Beef round block BHT per kg (Raw Material from Supplier) | Commercial-use sauce 2L*6 (Raw Material from supplier) | Pudding 1P | Pizza 1Pack (Store Manufacturing & Pricing) | Poteto Salad BHT/100g (Store Manufacturing & Pricing) | Deep frid chicken 1Pack (PC Manufacturing & Pricing) | Japanese mixed salad 50BHT/100g (PC Manufacturing & Pricing) | Commercial-use bacon BHT per kg (Raw Material from Supplier) | Commercial-use salad 1case (Raw Material from supplier) | Pork loin slice bht per kg (Intermediate Materials from PC) | Pizza dough 1case(Intermediate Materials from PC) | Mask 1P | Original my basket 1P |
| Sales List |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Store No. | List | Price Group Code | 1. Not allow blank
2. Price Group must exist in the system | 1. Not allow blank | Y | Retail Barcode's Sales Tab |  |  |  | 1+999999 | 1+999999 | 1+999999 | 2+999999 | 2+999999 | 2+99999 | 2+99999 | N/A | N/A | 3+999999 | 3+99999 | 3+99999 | N/A | N/A | N/A | N/A | N/A | N/A | 4+999999 | 4+99999 | 4+99999 | N/A | N/A | 4+999999 | 3+999999 | 3+999999 | N/A | N/A | N/A | N/A | N/A | N/A | 6+999999 | 6+999999 |  |  |  |
|  |  | Barcode No. | Text13 | Barcode No. (Both Base and Additional Barcode) | 1. Not allow blank
2. Barcode must exist in the system | 1. Not allow blank | Y | Retail Barcode |  |  |  | LOPIA Cola 500ml | LOPIA Cola 500ml | LOPIA Cola 500ml | Banana | Poteto | Poteto | Poteto | N/A | N/A | Seafood Mix | Seafood Bowl | Shrimp | N/A | N/A | N/A | N/A | N/A | N/A | Wiener | Ground pork | Beef Steak | N/A | N/A | Wiener | Seafood Bowl | Shrimp | N/A | N/A | N/A | N/A | N/A | N/A | Mask | Original my basket |  |  |  |
|  |  | Barcode Description | Text30 | Use for Information purpose during item export. 
(No involvement for data modification) | N/A | N/A | Y | Retail Barcode |  |  |  | 4901230000020 | 4901230000030 | 4901230000040 | 4901234200010 | 2+12 Digits(Auto Generated) | 2+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 2+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | N/A | N/A | 4901234200010 | 2+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 2+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | N/A | N/A | N/A | N/A | N/A | N/A | 4901234200010 | 4+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 4+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | N/A | N/A | 4901234200010 | 2+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 2+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | N/A | N/A | N/A | N/A | N/A | N/A | 4901234200010 | 6+12 Digits(Auto Generated) |  |  |  |
|  |  | Barcode Unit of Measure | List | Use for Information purpose during item export. 
(No involvement for data modification) | N/A | N/A | Y | Retail Barcode |  |  |  | Cola 500ml | Cola 500ml 6-pack | Cola 500ml 24-bottle case | Banana Bunch 1P | Poteto 1P | Poteto 10P/Bag | Poteto BHT/100g | N/A | N/A | Seafood Mix 1P | Seafood Bowl 1Pack | Shrimp 1Pack | N/A | N/A | N/A | N/A | N/A | N/A | Wiener 1P | Ground pork 1Pack | Beef Steak 1Pack | N/A | N/A | Wiener 1P | Seafood Bowl 1Pack | Shrimp 1Pack | N/A | N/A | N/A | N/A | N/A | N/A | Mask 1P | Original my basket 1P |  |  |  |
|  |  | Unit Price | Decimal | Price based on Barcode Unit of Measure | 1. Not allow zero | 1. Not allow zero |  | Retail Barcode's Sales Tab |  |  |  | PCS | PACK6 | CTN24 | PCS | PCS | PCS | PCS? | N/A | N/A | PCS | PCS | PCS | N/A | N/A | N/A | N/A | N/A | N/A | PCS | PCS | PCS | N/A | N/A | PCS | PCS | PCS | N/A | N/A | N/A | N/A | N/A | N/A | PCS | PCS |  |  |  |
|  |  | Weight Price | Decimal | Price based on 100G (For Price-embedded Barcode only) | 1. Allow Blank | 1. Allow Blank | Y | Retail Barcode's Sales Tab
(Create as new sales price record in 100G) |  |  |  | 1001 | 1001 | 1001 | 1001 | 1001 | 1001 | 1001 | N/A | N/A | 1001 | 1001 | 1001 | N/A | N/A | N/A | N/A | N/A | N/A | 1001 | 1001 | 1001 | N/A | N/A | 1001 | 1001 | 1001 | N/A | N/A | N/A | N/A | N/A | N/A | 1001 | 1001 |  |  |  |
|  |  | Starting Date | Date | Define if the price has starting date

Default Price
1. If there is any Sales price with blank starting date and ending date, this will be the default price.

Date Specific Price
2. If there is any Sales price with either starting date or ending date or both this will be the Date specific price | 1. If system not found any default specific price, system will create one.
2. If system not found any date specific price, system will create one. | 1. Only update the price based on
- Default Price (no value)
- Date Specific Price (with value) | Y | Retail Barcode's Sales Tab |  |  |  | 100 | 500 | 3000 | 50 | 10 | 80 | 5 | N/A | N/A | 110 | 500 | 60 | N/A | N/A | N/A | N/A | N/A | N/A | 150 | 500 | 60 | N/A | N/A | 50 | 500 | 60 | N/A | N/A | N/A | N/A | N/A | N/A | 50 | 80 |  |  |  |
|  |  | Ending Date | Date | Define if the price has ending date

Default Price
1. If there is any Sales price with blank starting date and ending date, this will be the default price.

Date Specific Price
2. If there is any Sales price with either starting date or ending date or both this will be the Date specific price | 1. If system not found any default specific price, system will create one.
2. If system not found any date specific price, system will create one.
3. Ending date is not allow if the starting date is blank | 1. Only update the price based on
- Default Price (no value)
- Date Specific Price (with value) | Y | Retail Barcode's Sales Tab |  |  |  |  |  |  |  |  |  |  | N/A | N/A |  |  |  | N/A | N/A | N/A | N/A | N/A | N/A |  |  |  | N/A | N/A |  |  |  | N/A | N/A | N/A | N/A | N/A | N/A |  |  |  |  |  |
|  |  | POP Image ID | Integer | Define the POP Image ID for ISHIDA Printer | 1. Allow Blank | 1. Allow Blank | Y | Retail Barcode's Sales Tab |  |  |  |  |  |  |  |  |  |  | N/A | N/A |  |  |  | N/A | N/A | N/A | N/A | N/A | N/A |  |  |  | N/A | N/A |  |  |  | N/A | N/A | N/A | N/A | N/A | N/A |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |


## シート: Copy before Dec 25

|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Item Import Template　Type |  | Import Template　Field （To Be） |  | Import Template Field (Cactoz Original) | Item Screen | OIC Item Template | Shelf Label Conversion Target | ISHIDA Scale Conversion Target | Remarks(Japanese) | Remarks(English) | Test Data | LOPIA Cola 500ml | LOPIA Cola 500ml 6-pack | LOPIA Cola 500ml 24-bottle case | Banana bunch  1P | Poteto 1P | Poteto 10P | Poteto BHT/100g | Poteto 2kg 1Case | Meron 1P | Seafood Mix 1P (Manufacturer barcode) | Seafood bowl 1Pack (Store Manufacturing & Pricing) | Shrimp BHT/100g (Store Manufacturing & Pricing) | Sushi 1Pack (PC Manufacturing & Pricing) | Salmon Sashimi 50BHT/100g (PC Manufacturing & Pricing) | Crab BHT per kg (Raw Material from Supplier) | Oyster 2kg 1case (Raw Material from supplier) | Tuna Sashimi 2kg (Intermediate Materials from PC) | Sumeshi BHT per kg (Intermediate Materials from PC) | Wiener 1P | Ground pork 1Pack (Store Manufacturing & Pricing) | Beef Steak BHT/100g (Store Manufacturing & Pricing) | Beef round block BHT per kg (Raw Material from Supplier) | Commercial-use sauce 2L*6 (Raw Material from supplier) | Pudding 1P | Pizza 1Pack (Store Manufacturing & Pricing) | Poteto Salad BHT/100g (Store Manufacturing & Pricing) | Deep frid chicken 1Pack (PC Manufacturing & Pricing) | Japanese mixed salad 50BHT/100g (PC Manufacturing & Pricing) | Commercial-use bacon BHT per kg (Raw Material from Supplier) | Commercial-use salad 1case (Raw Material from supplier) | Pork loin slice bht per kg (Intermediate Materials from PC) | Pizza dough 1case(Intermediate Materials from PC) | Mask 1P | Original my basket 1P |  |  |
| Item |  |  |  |  |  |  |  |  |  |  |  | 2 | 2 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 23 | 24 | 30 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 |  |  |
|  |  | Product Group Code | list | Y | Item Category Code | Product Classification |  |  | 現在の取り込みだと小分類になっているが、細分類を設定する　（Retail Barcodeは細分類になっている） | In the current data import, it is mapped to Item Category Code, but we will configure it to Product Category Code instead. (Retail Barcode uses the Product Category Code.) |  | 110101001 | 110101001 | 110101001 | 210101001 | 210101001 | 210101001 | 210101001 | 920101001 | 920101001 | 310101001 | 310101001 | 310101001 | 310101001 | 310101002 | 930101002 | 930101002 | 930101002 | 930101002 | 410101001 | 410101001 | 410101001 | 940101001 | 940101002 | 510101001 | 510101001 | 510101001 | 510101001 | 510101001 | 950101001 | 950101001 | 950101001 | 950101001 | 610101001 | 610101001 |  |  |
|  |  | No. | Char | Y | No. | N/A |  |  | 自動採番になるはずでは？移行時はOICで採番することも可能 | It should be automatically generated, shouldn’t it?
During the migration, it is also possible for OIC to generate the numbers. |  | 1+999999 | 1+999999 | 1+999999 | 2+999999 | 2+999999 | 2+99999 | 2+99999 | 92+999999 | 92+999999 | 3+999999 | 3+99999 | 3+99999 | 3+99999 | 3+99999 | 93+999999 | 93+999999 | 93+999999 | 93+999999 | 4+999999 | 4+99999 | 4+99999 | 94+999999 | 94+999999 | 5+999999 | 5+99999 | 5+99999 | 5+99999 | 5+99999 | 95+999999 | 95+999999 | 95+999999 | 95+999999 | 6+999999 | 6+999999 |  |  |
|  |  | Description | Char | Y | Description | Product Name（English） |  |  |  |  |  | LOPIA Cola 500ml | LOPIA Cola 500ml | LOPIA Cola 500ml | Banana | Poteto | Poteto | Poteto | Poteto | Meron | Seafood Mix | Seafood bowl | Shrimp | Sushi | Salmon Sashimi | Crab | Oyster | Tuna Sashimi | Sumeshi | Wiener | Ground pork | Beef Steak | Beef round block | Commercial-use sauce | Pudding | Pizza | Poteto Salad | Deep frid chicken | Japanese mixed salad | Commercial-use bacon | Commercial-use salad | Pork loin slice | Pizza dough | Mask | Original my basket |  |  |
|  |  | POS Description | Char | Y | N/A | N/A |  |  | これはBarcode単位で不要では？ | Since this will be configured at the barcode level, isn’t this unnecessary? |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Label Description | Char | Y | N/A | N/A |  |  | これはBarcode単位で不要では？ | Since this will be configured at the barcode level, isn’t this unnecessary? |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Base Unit of Measure | list | Y | Base Unit of Measure | N/A |  |  |  |  |  | PCS | PCS | PCS | PCS | PCS | PCS | PCS? | Carton | PCS | PCS | PCS | PCS | PCS | PCS | KG | Carton | Carton | KG | PCS | PCS | PCS | KG | Carton | PCS | PCS | PCS | PCS | PCS | KG | Carton | Carton | Carton | PCS | PCS |  |  |
|  |  | Costing Method | list | Y | Costing Method | N/A |  |  | メーカーバーコード商品はAverageで、原材料やCK製造・店内加工など非バーコード商品はSTANDARDを設定 | For products with manufacturer barcodes, we are using Average costing, and for non-barcode items such as raw materials, CK production, and in-store processed items, we are using Standard. Is my understanding correct? |  | Average | Average | Average | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard | Standard |  |  |
|  |  | VAT Prod. Posting Group | list | Y | VAT Prod. Posting Group | Tax Classification |  |  |  |  |  | VAT07 | VAT07 | VAT07 | VAT00 | VAT00 | VAT00 | VAT00 | VAT00 | VAT00 | VAT00 | VAT07 | VAT00 | VAT07 | VAT00 | VAT00 | VAT00 | VAT00 | VAT07 | VAT07 | VAT00 | VAT00 | VAT00 | VAT07 | VAT07 | VAT07 | VAT00 | VAT07 | VAT07 | VAT07 | VAT07 | VAT00 | VAT07 | VAT07 | VAT07 |  |  |
|  |  | Gen. Prod. Posting Group | list | Y | Gen. Prod. Posting Group | Item Type |  |  | テンプレートでは、INHOUSE,TRADE,SERVICEだが変更、メーカーバーコードがOUTLIGHT、店舗加工・CK製造商品がPRODUCE、原材料がRAWMATERIAL、消耗品がSUPPLY 食品以外で販売する商品（ショッピングバック）はOUTLIGHTでいい？ | In the template, the item types are INHOUSE, TRADE, and SERVICE, but we will change them as follows:
Manufacturer-barcode items → OUTLIGHT
In-store processed / CK production items → PRODUCE
Raw materials → RAWMATERIAL
Consumables → SUPPLY

For non-food items sold in the store (such as shopping bags), should we also categorize them as OUTLIGHT? |  | OUTLIGHT | OUTLIGHT | OUTLIGHT | OUTLIGHT | OUTLIGHT? | Produced? | Produced? | RawMaterial | RawMaterial | OUTLIGHT | Produced | Produced | Produced | Produced | RawMaterial | RawMaterial | RawMaterial | RawMaterial | OUTLIGHT | Produced | Produced | RawMaterial | RawMaterial | OUTLIGHT | Produced | Produced | Produced | Produced | RawMaterial | RawMaterial | RawMaterial | RawMaterial | OUTLIGHT? | OUTLIGHT |  |  |
|  |  | Inventory Posting Group | list | Y |  |  |  |  | 同上 |  |  | OUTLIGHT | OUTLIGHT | OUTLIGHT | OUTLIGHT | OUTLIGHT? | Produced? | Produced? | RawMaterial | RawMaterial | OUTLIGHT | Produced | Produced | Produced | Produced | RawMaterial | RawMaterial | RawMaterial | RawMaterial | OUTLIGHT | Produced | Produced | RawMaterial | RawMaterial | OUTLIGHT | Produced | Produced | Produced | Produced | RawMaterial | RawMaterial | RawMaterial | RawMaterial | OUTLIGHT? | OUTLIGHT |  |  |
|  |  | Keying in Price | list | Y | N/A |  |  |  | これはSales Price単位でItemでは不要では？（画面上もSales Price単位で定義されている） | Isn’t this unnecessary at the Item level, since it is managed at the Sales Price level? (It is also defined at the Sales Price level on the screen.) |  | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory |  |  | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory |  |  |  |  | Not Mandatory | Not Mandatory | Not Mandatory |  |  | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory |  |  |  |  | Not Mandatory | Not Mandatory |  |  |
|  |  | Keying in Quantity | list | Y | N/A |  |  |  | 同上 | Same as above |  | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory |  |  | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory |  |  |  |  | Not Mandatory | Not Mandatory | Not Mandatory |  |  | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory |  |  |  |  | Not Mandatory | Not Mandatory |  |  |
|  |  | Zero Price Valid | Boolean | Y | N/A |  |  |  | 同上 | Same as above |  | 0 | 0 | 0 | 0 | 0 | 0 | 0 |  |  | 0 | 0 | 0 | 0 | 0 |  |  |  |  | 0 | 0 | 0 |  |  | 0 | 0 | 0 | 0 | 0 |  |  |  |  | 0 | 0 |  |  |
|  |  | No Discount Allowed | Boolean | Y | N/A |  |  |  | 同上 | Same as above |  | 0 | 0 | 0 | 0 | 0 | 0 | 0 |  |  | 0 | 0 | 0 | 0 | 0 |  |  |  |  | 0 | 0 | 0 |  |  | 0 | 0 | 0 | 0 | 0 |  |  |  |  | 0 | 0 |  |  |
|  |  | Blocked | Boolean | Y | N/A |  |  |  | 同上 | Same as above |  | 0 | 0 | 0 | 0 | 0 | 0 | 0 |  |  | 0 | 0 | 0 | 0 | 0 |  |  |  |  | 0 | 0 | 0 |  |  | 0 | 0 | 0 | 0 | 0 |  |  |  |  | 0 | 0 |  |  |
|  | ※The items highlighted in yellow below are mandatory for data import. |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Manufacturer name (Thai) | Char | N |  | Manufacturer name (Thai) | Y |  |  |  |  | บริษัท แอล ฟู๊ดส์ จำกัด | บริษัท แอล ฟู๊ดส์ จำกัด | บริษัท แอล ฟู๊ดส์ จำกัด |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Manufacturer name (English) | Char | N |  | Manufacturer name (English) | Y |  |  |  |  | L Foods Co., Ltd. | L Foods Co., Ltd. | L Foods Co., Ltd. |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Item Name （Thai） | Char | N |  | Product Name（Thai） |  |  |  |  |  | โลเปีย　โคล่า 500 มล. | โลเปีย　โคล่า 500 มล. | โลเปีย　โคล่า 500 มล. | มันฝรั่ง | มันฝรั่ง | มันฝรั่ง | มันฝรั่ง | มันฝรั่ง | มันฝรั่ง | มันฝรั่ง | เก็บในอุณหภูมิต่ำกว่า 4 องศาเซลเซียส | เก็บในอุณหภูมิต่ำกว่า 4 องศาเซลเซียส | เก็บในอุณหภูมิต่ำกว่า 4 องศาเซลเซียส | เก็บในอุณหภูมิต่ำกว่า 4 องศาเซลเซียส |  |  |  |  | เก็บในอุณหภูมิต่ำกว่า 4 องศาเซลเซียส | เก็บในอุณหภูมิต่ำกว่า 4 องศาเซลเซียส | เก็บในอุณหภูมิต่ำกว่า 4 องศาเซลเซียส |  |  | เก็บในอุณหภูมิต่ำกว่า 4 องศาเซลเซียส | มันฝรั่ง | เก็บในอุณหภูมิต่ำกว่า 4 องศาเซลเซียส | มันฝรั่ง | เก็บในอุณหภูมิต่ำกว่า 4 องศาเซลเซียส |  |  |  |  |  |  |  |  |
|  |  | Storage Temerature | list | N |  | Storage Temerature | Y |  |  |  |  | Room temperature | Room temperature | Room temperature | Room temperature | Room temperature | Room temperature | Room temperature | Room temperature | Room temperature | Room temperature | Keep refrigerated below 4℃ | Keep refrigerated below 4℃ | Keep refrigerated below 4℃ | Keep refrigerated below 4℃ |  |  |  |  | Keep refrigerated below 4℃ | Keep refrigerated below 4℃ | Keep refrigerated below 4℃ |  |  | Keep refrigerated below 4℃ | Room temperature | Keep refrigerated below 4℃ | Room temperature | Keep refrigerated below 4℃ |  |  |  |  |  |  |  |  |
|  |  | Storage Method (Thai) | Char | N |  | Storage Method (Thai) | Y |  |  |  |  | กรุณาเก็บให้พ้นแสงแดดโดยตรง | กรุณาเก็บให้พ้นแสงแดดโดยตรง | กรุณาเก็บให้พ้นแสงแดดโดยตรง |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Storage Method (English) | Char | N |  | Storage Method (English) | Y |  |  |  |  | Please store away from direct sunlight. | Please store away from direct sunlight. | Please store away from direct sunlight. |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Coutry of Origin(Thai) | Char | N |  | Coutry of Origin(Thai) | Y |  |  |  |  | ไทย | ไทย | ไทย | ญี่ปุ่น | ไทย | ไทย | ไทย | ไทย | ไทย | ไทย | ญี่ปุ่น | ญี่ปุ่น | ญี่ปุ่น | ญี่ปุ่น | ไทย | ไทย | ญี่ปุ่น | ไทย | ไทย | ญี่ปุ่น | ญี่ปุ่น | ไทย | ไทย | ไทย | ญี่ปุ่น | ญี่ปุ่น | ญี่ปุ่น | ญี่ปุ่น | ไทย | ไทย | ญี่ปุ่น | ไทย |  |  |  |  |
|  |  | Coutry of Origin(English) | Char | N |  | Coutry of Origin(English) | Y |  |  |  |  | Thailand | Thailand | Thailand | Japan | Thailand | Thailand | Thailand | Thailand | Thailand | Thailand | Japan | Japan | Japan | Japan | Thailand | Thailand | Japan | Thailand | Thailand | Japan | Japan | Thailand | Thailand | Thailand | Japan | Japan | Japan | Japan | Thailand | Thailand | Japan | Thailand |  |  |  |  |
|  |  | Allergen Grains containing gluten | Y/N | N |  | Allergen Grains containing gluten | Y |  |  |  |  | N | N | N | N |  |  |  |  |  | N |  |  | N | N |  |  |  |  | N |  |  |  |  | N |  |  | N | N |  |  |  |  |  |  |  |  |
|  |  | Allergen Crustaceans | Y/N | N |  | Allergen Crustaceans | Y |  |  |  |  | N | N | N | N |  |  |  |  |  | N |  |  | N | N |  |  |  |  | N |  |  |  |  | N |  |  | N | N |  |  |  |  |  |  |  |  |
|  |  | Allergen Mollusks / Shellfish and their product | Y/N | N |  | Allergen Mollusks / Shellfish and their product | Y |  |  |  |  | N | N | N | N |  |  |  |  |  | N |  |  | N | N |  |  |  |  | N |  |  |  |  | N |  |  | N | N |  |  |  |  |  |  |  |  |
|  |  | Allergen Eggs and egg products | Y/N | N |  | Allergen Eggs and egg products | Y |  |  |  |  | N | N | N | N |  |  |  |  |  | N |  |  | N | N |  |  |  |  | N |  |  |  |  | Y |  |  | N | Y |  |  |  |  |  |  |  |  |
|  |  | Allergen Fish and fish products | Y/N | N |  | Allergen Fish and fish products | Y |  |  |  |  | N | N | N | N |  |  |  |  |  | Y |  |  | Y | Y |  |  |  |  | N |  |  |  |  | N |  |  | N | N |  |  |  |  |  |  |  |  |
|  |  | Allergen Peanuts and peanut products | Y/N | N |  | Allergen Peanuts and peanut products | Y |  |  |  |  | N | N | N | N |  |  |  |  |  | N |  |  | N | N |  |  |  |  | N |  |  |  |  | N |  |  | N | Y |  |  |  |  |  |  |  |  |
|  |  | Allergen Soybeans and soybean products | Y/N | N |  | Allergen Soybeans and soybean products | Y |  |  |  |  | N | N | N | N |  |  |  |  |  | N |  |  | N | N |  |  |  |  | N |  |  |  |  | N |  |  | N | N |  |  |  |  |  |  |  |  |
|  |  | Allergen Milk and dairy products | Y/N | N |  | Allergen Milk and dairy products | Y |  |  |  |  | N | N | N | N |  |  |  |  |  | N |  |  | N | N |  |  |  |  | N |  |  |  |  | N |  |  | N | N |  |  |  |  |  |  |  |  |
|  |  | Allergen Tree nuts (e.g. walnut, almond, pecan, etc.) | Y/N | N |  | Allergen Tree nuts (e.g. walnut, almond, pecan, etc.) | Y |  |  |  |  | N | N | N | N |  |  |  |  |  | N |  |  | N | N |  |  |  |  | N |  |  |  |  | N |  |  | N | N |  |  |  |  |  |  |  |  |
|  |  | Allergen Sulfites — when present at levels ≥ 10 mg/kg | Y/N | N |  | Allergen Sulfites — when present at levels ≥ 10 mg/kg | Y |  |  |  |  | N | N | N | N |  |  |  |  |  | N |  |  | N | N |  |  |  |  | N |  |  |  |  | N |  |  | N | N |  |  |  |  |  |  |  |  |
|  |  | Allergen Remarks (English) | Char | N |  | Allergen Remarks (English) | Y |  |  |  |  | No known major allergens | No known major allergens | No known major allergens |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Allergen Remarks (Thai) | Char | N |  | Allergen Remarks (Thai) | Y |  |  |  |  | ไม่มีสารก่อภูมิแพ้ที่สำคัญ | ไม่มีสารก่อภูมิแพ้ที่สำคัญ | ไม่มีสารก่อภูมิแพ้ที่สำคัญ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | ※Even if the following items cannot be imported in the worst case, it will still be fine for the opening of Store #1. |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Manufacturer name (Japanese) | Char |  |  | Manufacturer name (Japanese) |  |  |  |  |  | 日本L食品株式会社 | 日本L食品株式会社 | 日本L食品株式会社 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Item Name （Japanese） | Char |  |  | Product Name（Japanese） |  |  |  |  |  | コーラ 500ml | コーラ 500ml | コーラ 500ml | バナナ | じゃがいも | じゃがいも | じゃがいも | じゃがいも | メロン | シーフードミックス | 海鮮丼 | エビ | 寿司 | サーモン刺身 | カニ | カキ | マグロ刺身 | 酢飯 | ウインナー | 豚ひき肉 | 牛ステーキ | 牛ももブロック | 業務用醤油 | プリン | ピザ | ポテトサラダ | フライドチキン | あえもの | 業務用ベーコン | 業務用サラダ | 豚スライス | ピザ玉 | マスク | ロピアマイバスケット |  |  |
|  |  | Brand Name（Thai) | Char |  |  |  |  |  |  |  |  | โลเปีย　โคล่า | โลเปีย　โคล่า | โลเปีย　โคล่า |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Brand Name（English) | Char |  |  |  |  |  |  |  |  | LOPIA COLA | LOPIA COLA | LOPIA COLA |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Brand Name（Japanese) | Char |  |  |  |  |  |  |  |  | ロピアコーラ | ロピアコーラ | ロピアコーラ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Expiration Date (days) | Number |  |  |  |  |  |  |  |  | 390 | 390 | 390 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Barcode |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | No. |  |  | Item No | Item Code |  |  |  |  |  | 1+999999 | 1+999999 | 1+999999 | 2+999999 | 2+999999 | 2+99999 | 2+99999 | 92+999999 | 92+999999 | 3+999999 | 3+99999 | 3+99999 | 3+99999 | 3+99999 | 93+999999 | 93+999999 | 93+999999 | 93+999999 | 4+999999 | 4+99999 | 4+99999 | 94+999999 | 94+999999 | 5+999999 | 5+99999 | 5+99999 | 5+99999 | 5+99999 | 95+999999 | 95+999999 | 95+999999 | 95+999999 | 6+999999 | 6+999999 |  |  |
|  |  | Description |  |  | Description | N/A |  |  |  |  |  | LOPIA Cola 500ml | LOPIA Cola 500ml | LOPIA Cola 500ml | Banana Bunch | Poteto | Poteto | Poteto | Poteto | Meron | Seafood Mix | Seafood Bowl | Shrimp | Sushi | Salmon Sashimi | Crab | Oyster | Tuna Sashimi | Sumeshi | Wiener | Ground pork | Beef Steak | Beef round block | Commercial-use sauce | Pudding | Pizza | Poteto Salad | Deep frid chicken | Japanese mixed salad | Commercial-use bacon | Commercial-use salad | Pork loin slice | Pizza dough | Mask | Original my basket |  |  |
|  |  | Base Unit of Measure |  |  |  | N/A |  |  |  |  |  | PCS | PCS | PCS | PCS | PCS | PCS | PCS？ | Carton | PCS | PCS | PCS | PCS | PCS | PCS | 1KG | Carton | Carton | KG | PCS | PCS | PCS | KG | Carton | PCS | PCS | PCS | PCS | PCS | KG | Carton | KG | Carton | PCS | PCS |  |  |
|  |  | Barcode |  |  |  | Barcode |  | Y |  |  |  | 4901230000020 | 4901230000030 | 4901230000040 | 4901234200010 | 2+12 Digits(Auto Generated) | 2+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 2+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 2+12 Digits(Auto Generated) | 2+12 Digits(Auto Generated) | 4901234200010 | 3+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 3+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 3+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 3+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 3+12 Digits(Auto Generated) | 3+12 Digits(Auto Generated) | 3+12 Digits(Auto Generated) | 3+12 Digits(Auto Generated) | 4901234200010 | 4+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 4+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 4+12 Digits(Auto Generated) | 4+12 Digits(Auto Generated) | 4901234200010 | 5+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 5+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 5+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 5+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 5+12 Digits(Auto Generated) | 5+12 Digits(Auto Generated) | 5+12 Digits(Auto Generated) | 5+12 Digits(Auto Generated) | 4901234200010 | 6+12 Digits(Auto Generated) |  |  |
|  |  | Barcode Unit of Measure |  |  | Unit of Measure Code | Unit of Measure |  |  |  |  |  | PCS | PACK6 | CTN24 | PCS | PCS | PCS | PCS？ | Carton | PCS | PCS | PCS | PCS | PCS | PCS | 1KG | Carton | Carton | KG | PCS | PCS | PCS | KG | Carton | PCS | PCS | PCS | PCS | PCS | KG | Carton | KG | Carton | PCS | PCS |  |  |
|  |  | Barcode Description |  |  |  | Product Name(English) |  |  |  |  |  | Cola 500ml | Cola 500ml 6-pack | Cola 500ml 24-bottle case | Banana Bunch 1P | Poteto 1P | Poteto | Poteto | Poteto 2kg 1Case | Poteto 2kg 1Case | Seafood Mix 1P | Seafood Bowl 1Pack | Shrimp 1Pack | Sushi | Salmon Sashimi | Crab (per 1kg) | Oyster 2kg 1case | Tuna Sashimi 2kg 1Case | Sumeshi (per 1kg) | Wiener 1P | Ground pork 1Pack | Beef Steak 1Pack | Beef round block  (per kg) | Commercial-use sauce 2kg*6 | Wiener 1P | Ground pork 1Pack | Beef Steak 1Pack | Ground pork 1Pack | Beef Steak 1Pack | Beef round block  (per kg) | Commercial-use sauce 2kg*6 | Ground chiken (per kg) | Pork belly block (per KG) | Original my basket 1P | Mask 1P |  |  |
|  |  | Barcode POS Description |  |  |  | N/A |  |  |  |  |  | Cola 500ml | Cola 500ml 6-pack | Cola 500ml 24-bottle case | Banana Bunch 1P | Poteto 1P | Poteto | Poteto |  |  | Seafood Mix 1P | Seafood Bowl 1Pack | Shrimp 1Pack | Sushi | Salmon Sashimi |  |  |  |  | Wiener 1P | Ground pork 1Pack | Beef Steak 1Pack |  |  | Wiener 1P | Ground pork 1Pack | Beef Steak 1Pack | Ground pork 1Pack | Beef Steak 1Pack |  |  |  |  | Original my basket 1P | Mask 1P |  |  |
|  |  | Barcode Label Description |  |  |  | N/A |  | Y |  |  |  | Cola 500ml | Cola 500ml 6-pack | Cola 500ml 24-bottle case | Banana Bunch 1P | Poteto 1P | Poteto | Poteto |  |  | Seafood Mix 1P | Seafood Bowl 1Pack | Shrimp 1Pack | Sushi | Salmon Sashimi |  |  |  |  | Wiener 1P | Ground pork 1Pack | Beef Steak 1Pack |  |  | Wiener 1P | Ground pork 1Pack | Beef Steak 1Pack | Ground pork 1Pack | Beef Steak 1Pack |  |  |  |  | Original my basket 1P | Mask 1P |  |  |
|  |  | Qty per Unit of Measure |  |  |  | Quantity per UoM |  |  |  |  |  | 1 | 6 | 24 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | ※The items highlighted in yellow below are mandatory for data import. |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Barcode Item Name （Thai） | Char |  |  | Product Name(Thai) |  |  |  |  |  | โคล่า 500 มล. | โคล่า 500 มล. 6 แพ็ค | กล่องโคล่า 500 มล. 24 ขวด | กล้วย 1 หวี | มันฝรั่ง 1 ลูก | มันฝรั่ง 10 ชิ้น / ถุง | มันฝรั่ง บาท/100 กรัม | มันฝรั่ง 2 กก. 1 ลัง | มันฝรั่ง 2 กก. 1 ลัง | ซีฟู้ดรวม 1 ลูก | ซูชิ 1 แพ็ค | กุ้ง 1 แพ็ค | ซูชิ 1 แพ็ค | ซูชิ 1 แพ็ค | ปู (ต่อ 1 กิโลกรัม) | หอยนางรม 2 กก. 1 ลัง | ทูน่า 2 กก. 1 ลัง | ข้าวซูชิ (ต่อ 1 กิโลกรัม) | ไส้กรอก 1 แพ็ค | หมูบด 1 แพ็ค | สเต๊กเนื้อ 1 แพ็ค | เนื้อสะโพก ต่อกิโลกรัม | ซีอิ๊ว 2 กก. × 6 ขวด | ไส้กรอก 1 แพ็ค | หมูบด 1 แพ็ค | สเต๊กเนื้อ 1 แพ็ค | หมูบด 1 แพ็ค | สเต๊กเนื้อ 1 แพ็ค | เนื้อสะโพก ต่อกิโลกรัม | ซีอิ๊ว 2 กก. × 6 ขวด | ไก่บด 2 กก. | หมูสามชั้น ต่อกิโลกรัม | หน้ากาก 1 แพ็ค | ถุงตะกร้าโลเปีย 1 แพ็ค |  |  |
|  |  | Specification(Thai) | Char |  |  | Specification(Thai) | Y |  |  |  |  | 500มล. | 500มล.×6 | 500มล.×24 | 1 ลูก | 1 ลูก | N/A (ISHIDA Scale Generated) | N/A (ISHIDA Scale Generated) | 2 กก | 2 กก | 1 ลูก | 1 แพ็ค | 1 แพ็ค | 1 แพ็ค | 1 แพ็ค | 1 กก | 2 กก | 2 กก | 1 กก | 1 ลูก | 1 แพ็ค | 1 แพ็ค | 1 กก | 2 กก*6 | 1 ลูก | 1 แพ็ค | 1 แพ็ค | 1 แพ็ค | 1 แพ็ค | 1 กก | 2 กก*6 | 1 กก | 1 ลัง | 1 ลูก | 1 ลูก |  |  |
|  |  | Specification(English) | Char |  |  | Specification(English) | Y |  |  |  |  | 500ml | 500ml×6 | 500ml×24 | 1P | 1P | N/A (ISHIDA Scale Generated) | ISHIDA Scale Generated | 2kg | 2kg | 1P | 1Pack | 1Pack | 1Pack | 1Pack | 1kg | 2kg | 2kg | 1kg | 1P | 1Pack | 1Pack | 1kg | 2kg*6 | 1P | 1Pack | 1Pack | 1Pack | 1Pack | 1kg | 2kg*6 | 1kg | 1Case | 1P | 1P |  |  |
|  |  | Proposed Selling Price(BHT) | Number |  |  | Proposede Selling Price(BHT) | Y |  |  |  |  | 150 | 700 | 3000 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | ※Even if the following items cannot be imported in the worst case, it will still be fine for the opening of Store #1. |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Barcode Item Name （Japanese） | Char |  |  |  |  |  |  |  |  | コーラ500ml | コーラ500ml 6本パック | コーラ500ml 24本ケース | バナナ　1房/袋 | じゃがいも1個 | じゃがいも　１袋 | じゃがいも | じゃがいも2kg/ケース | じゃがいも2kg/ケース | シーフードミックス 1P | 海鮮丼１パック | エビ１パック | 寿司１パック | サーモン刺身 | カニ　1kg単位 | カキ 2kg/ケース | まぐろ刺身　2kg/ケース | 酢飯　1kg単位 | ウインナー 1P | 豚ひき肉 1P | 牛ステーキ 1P | 牛ももブロック kgあたり | 業務用醤油　2ｋｇ＊6本 | ウインナー 1P | 豚ひき肉 1P | 牛ステーキ 1P | 豚ひき肉 1P | 牛ステーキ 1P | 牛ももブロック kgあたり | 業務用醤油　2ｋｇ＊6本 | 鶏ひき肉　ｋｇ当たり | ピザ玉 | マスク　1P | ロピアマイバスケット 1P |  |  |
|  | x | Manufacturer's suggested Retail Price(BHT) | Number |  |  |  |  |  |  |  |  | 150 | 700 | 3000 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Barcode Item Size(Width) | Number |  |  |  |  |  |  |  |  | 10 | 10 | 20 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Barcode Item Size(Height) | Number |  |  |  |  |  |  |  |  | 4 | 8 | 16 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Barcode Item Size(Depth) | Number |  |  |  |  |  |  |  |  | 4 | 12 | 36 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | x | Barcode Item Package Size(Width) | Number |  |  |  |  |  |  |  |  | 20 | 20 | 20 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | x | Barcode Item Package Size(Height) | Number |  |  |  |  |  |  |  |  | 16 | 16 | 16 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | x | Barcode Item Package Size(Depth) | Number |  |  |  |  |  |  |  |  | 36 | 36 | 36 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Product Weight (kg) | Number |  |  |  |  |  |  |  |  | 0.3 | 1.8 | 7.2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Sales List |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | No. | Y |  | Item No | Item Code | Y |  |  |  |  | 1+999999 | 1+999999 | 1+999999 | 2+999999 | 2+999999 | 2+99999 | 2+99999 | N/A | N/A | 3+999999 | 3+99999 | 3+99999 | N/A | N/A | N/A | N/A | N/A | N/A | 4+999999 | 4+99999 | 4+99999 | N/A | N/A | 4+999999 | 3+999999 | 3+999999 | N/A | N/A | N/A | N/A | N/A | N/A | 6+999999 | 6+999999 |  |  |
|  |  | Description | Y |  |  |  | Y |  |  |  |  | LOPIA Cola 500ml | LOPIA Cola 500ml | LOPIA Cola 500ml | Banana | Poteto | Poteto | Poteto | N/A | N/A | Seafood Mix | Seafood Bowl | Shrimp | N/A | N/A | N/A | N/A | N/A | N/A | Wiener | Ground pork | Beef Steak | N/A | N/A | Wiener | Seafood Bowl | Shrimp | N/A | N/A | N/A | N/A | N/A | N/A | Mask | Original my basket |  |  |
|  |  | Barcode | Y |  |  |  | Y |  |  |  |  | 4901230000020 | 4901230000030 | 4901230000040 | 4901234200010 | 2+12 Digits(Auto Generated) | 2+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 2+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | N/A | N/A | 4901234200010 | 2+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 2+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | N/A | N/A | N/A | N/A | N/A | N/A | 4901234200010 | 4+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 4+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | N/A | N/A | 4901234200010 | 2+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 2+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | N/A | N/A | N/A | N/A | N/A | N/A | 4901234200010 | 6+12 Digits(Auto Generated) |  |  |
|  |  | Barcode Description | Y |  |  |  | Y |  |  |  |  | Cola 500ml | Cola 500ml 6-pack | Cola 500ml 24-bottle case | Banana Bunch 1P | Poteto 1P | Poteto 10P/Bag | Poteto BHT/100g | N/A | N/A | Seafood Mix 1P | Seafood Bowl 1Pack | Shrimp 1Pack | N/A | N/A | N/A | N/A | N/A | N/A | Wiener 1P | Ground pork 1Pack | Beef Steak 1Pack | N/A | N/A | Wiener 1P | Seafood Bowl 1Pack | Shrimp 1Pack | N/A | N/A | N/A | N/A | N/A | N/A | Mask 1P | Original my basket 1P |  |  |
|  |  | Unit of Measure | Y |  |  |  |  |  |  |  |  | PCS | PACK6 | CTN24 | PCS | PCS | PCS | PCS? | N/A | N/A | PCS | PCS | PCS | N/A | N/A | N/A | N/A | N/A | N/A | PCS | PCS | PCS | N/A | N/A | PCS | PCS | PCS | N/A | N/A | N/A | N/A | N/A | N/A | PCS | PCS |  |  |
|  |  | Store Code | Y |  |  |  | Y |  |  |  |  | 1001 | 1001 | 1001 | 1001 | 1001 | 1001 | 1001 | N/A | N/A | 1001 | 1001 | 1001 | N/A | N/A | N/A | N/A | N/A | N/A | 1001 | 1001 | 1001 | N/A | N/A | 1001 | 1001 | 1001 | N/A | N/A | N/A | N/A | N/A | N/A | 1001 | 1001 |  |  |
|  |  | Unit Price | Y |  |  |  | Y |  |  |  |  | 100 | 500 | 3000 | 50 | 10 | 80 | 5 | N/A | N/A | 110 | 500 | 60 | N/A | N/A | N/A | N/A | N/A | N/A | 150 | 500 | 60 | N/A | N/A | 50 | 500 | 60 | N/A | N/A | N/A | N/A | N/A | N/A | 50 | 80 |  |  |
|  |  | Starting Date | Y |  |  |  | Y |  |  |  |  |  |  |  |  |  |  |  | N/A | N/A |  |  |  | N/A | N/A | N/A | N/A | N/A | N/A |  |  |  | N/A | N/A |  |  |  | N/A | N/A | N/A | N/A | N/A | N/A |  |  |  |  |
|  |  | Ending Date | Y |  |  |  | Y |  |  |  |  |  |  |  |  |  |  |  | N/A | N/A |  |  |  | N/A | N/A | N/A | N/A | N/A | N/A |  |  |  | N/A | N/A |  |  |  | N/A | N/A | N/A | N/A | N/A | N/A |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | ※The following fields are displayed on the Retail Barcode (Sales) screen, and my understanding is that they should be defined in the import data as well. |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | N/A | N |  | Defauly Price | N/A |  |  |  |  |  | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | N/A | N/A | Not Mandatory | Not Mandatory | Not Mandatory | N/A | N/A | N/A | N/A | N/A | N/A | Not Mandatory | Not Mandatory | Not Mandatory | N/A | N/A | Not Mandatory | Not Mandatory | Not Mandatory | N/A | N/A | N/A | N/A | N/A | N/A | Not Mandatory | Not Mandatory |  |  |
|  |  | N/A | N |  | Keying in Price | N/A |  |  |  |  |  | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | Not Mandatory | N/A | N/A | Not Mandatory | Not Mandatory | Not Mandatory | N/A | N/A | N/A | N/A | N/A | N/A | Not Mandatory | Not Mandatory | Not Mandatory | N/A | N/A | Not Mandatory | Not Mandatory | Not Mandatory | N/A | N/A | N/A | N/A | N/A | N/A | Not Mandatory | Not Mandatory |  |  |
|  |  | N/A | N |  | Keying in Quantity | N/A |  |  |  |  |  | 0 | 0 | 0 | 0 | 0 | 0 | 0 | N/A | N/A | 0 | 0 | 0 | N/A | N/A | N/A | N/A | N/A | N/A | 0 | 0 | 0 | N/A | N/A | 0 | 0 | 0 | N/A | N/A | N/A | N/A | N/A | N/A | 0 | 0 |  |  |
|  |  | N/A | N |  | Zero Price Valid | N/A |  |  |  |  |  | 0 | 0 | 0 | 0 | 0 | 0 | 0 | N/A | N/A | 0 | 0 | 0 | N/A | N/A | N/A | N/A | N/A | N/A | 0 | 0 | 0 | N/A | N/A | 0 | 0 | 0 | N/A | N/A | N/A | N/A | N/A | N/A | 0 | 0 |  |  |
|  |  | N/A | N |  | No Discount Allowed | N/A |  |  |  |  |  | 0 | 0 | 0 | 0 | 0 | 0 | 0 | N/A | N/A | 0 | 0 | 0 | N/A | N/A | N/A | N/A | N/A | N/A | 0 | 0 | 0 | N/A | N/A | 0 | 0 | 0 | N/A | N/A | N/A | N/A | N/A | N/A | 0 | 0 |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Purchase List |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Vendor No | Char |  |  | Supplier Code |  |  |  |  |  | 10001 | 10001 | 10001 | 20001 | N/A | N/A | N/A | 20001 | 20001 | 20001 | N/A | N/A | PC's Location code? | PC's Location code? | 30001 | 30002 | PC's Location code? | PC's Location code? | 40001 | N/A | N/A | 40001 | 40002 | 40001 | N/A | N/A | PC's Location code? | PC's Location code? | 50001 | 50002 | PC's Location code? | PC's Location code? | 60001 | 60002 |  |  |
|  |  | Barcode |  |  |  | Barcode |  | Y |  |  |  | 4901230000020 | 4901230000030 | 4901230000040 | 4901234200010 | N/A | N/A | N/A | 2+12 Digits(Auto Generated) | 2+12 Digits(Auto Generated) | 4901234200010 | N/A | N/A | 3+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 3+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 3+12 Digits(Auto Generated) | 3+12 Digits(Auto Generated) | 3+12 Digits(Auto Generated) | 3+12 Digits(Auto Generated) | 4901234200010 | N/A | N/A | 4+12 Digits(Auto Generated) | 4+12 Digits(Auto Generated) | 4901234200010 | N/A | N/A | 5+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 5+5digits(ItemCode)+5digits(Price) +C/D (ISHIDA Scale Generated) | 5+12 Digits(Auto Generated) | 5+12 Digits(Auto Generated) | 5+12 Digits(Auto Generated) | 5+12 Digits(Auto Generated) | 4901234200010 | 6+12 Digits(Auto Generated) |  |  |
|  |  | Unit Cost | Number |  | Direct Unit Cost | Unit Cost(Amount BHT) |  |  |  |  |  | 99 | 594 | 2376 | 40 | N/A | N/A | N/A | 200 | 200 | 100 | N/A | N/A | 80 | 200 | 1000 | 3000 | 500 | 500 | 100 | N/A | N/A | 1000 | 3000 | 100 | N/A | N/A | 80 | 200 | 1000 | 3000 | 500 | 500 | 40 | 60 |  |  |
|  |  | Staring Date | Date |  | Staring Date | Staring Date |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Ending Date | Dare |  | Ending Date | Ending Date |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Minimum Quantity | Number |  | Minimum Quantity | Minimum Order |  |  |  |  |  | 24 | 4 | 1 | 1 | N/A | N/A | N/A | 1 | 1 | 1 | N/A | N/A | 1 | 1 | 1 | 1 | 1 | 1 | 1 | N/A | N/A | 5 | 1 | 1 | N/A | N/A | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 2 |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | ※The items highlighted in yellow below are mandatory for data import. |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Supplier item code | Char | N | Vendor Item No | Supplier item code |  |  |  |  |  | 12345 | 23456 | 34567 | P2001 | N/A | N/A | N/A | P1001 | P1001 | P3001 | N/A | N/A |  |  | AB-001 | H1111 |  |  | P4001 | N/A | N/A | AB-001 | H1111 | P4001 | N/A | N/A |  |  | AB-001 | H1111 |  |  | P2001 |  |  |  |
|  |  | Order Unit | Number | N | N/A | Order Unit |  |  |  |  |  | 24 | 4 | 1 | 24 | N/A | N/A | N/A | 1 | 1 | 24 | N/A | N/A | 20 | 20 | 1 | 1 | 1 | 1 | 24 | N/A | N/A | 1 | 1 | 24 | N/A | N/A | 20 | 20 | 1 | 1 | 1 | 1 | 24 | 100 |  |  |
|  |  | Delivery Lead Time (Mon) | Number | N | N/A | Delivery Lead Time (Mon) |  |  |  |  |  | 2 | 2 | 2 | 2 | N/A | N/A | N/A | 2 | 2 | 2 | N/A | N/A | 2 | 2 | 2 | 3 | 2 | 2 | 2 | N/A | N/A | 2 | 3 | 2 | N/A | N/A | 2 | 2 | 2 | 3 | 2 | 2 | 2 | 2 |  |  |
|  |  | Delivery Lead Time (Tue) | Number | N | N/A | Delivery Lead Time (Tue) |  |  |  |  |  | 2 | 2 | 2 | 2 | N/A | N/A | N/A | 2 | 2 | 2 | N/A | N/A | 2 | 2 | 2 | 3 | 2 | 2 | 2 | N/A | N/A | 2 | 3 | 2 | N/A | N/A | 2 | 2 | 2 | 3 | 2 | 2 | 2 | 2 |  |  |
|  |  | Delivery Lead Time (Wed) | Number | N | N/A | Delivery Lead Time (Wed) |  |  |  |  |  | 2 | 2 | 2 | 2 | N/A | N/A | N/A | 2 | 2 | 2 | N/A | N/A | 2 | 2 | 2 | 3 | 2 | 2 | 2 | N/A | N/A | 2 | 3 | 2 | N/A | N/A | 2 | 2 | 2 | 3 | 2 | 2 | 2 | 2 |  |  |
|  |  | Delivery Lead Time (Thr) | Number | N | N/A | Delivery Lead Time (Thr) |  |  |  |  |  | 2 | 2 | 2 | 2 | N/A | N/A | N/A | 2 | 2 | 2 | N/A | N/A | 2 | 2 | 2 | 3 | 2 | 2 | 2 | N/A | N/A | 2 | 3 | 2 | N/A | N/A | 2 | 2 | 2 | 3 | 2 | 2 | 2 | 2 |  |  |
|  |  | Delivery Lead Time (Fri) | Number | N | N/A | Delivery Lead Time (Fri) |  |  |  |  |  | 2 | 2 | 2 | 2 | N/A | N/A | N/A | 2 | 2 | 2 | N/A | N/A | 2 | 2 | 2 | 3 | 2 | 2 | 2 | N/A | N/A | 2 | 3 | 2 | N/A | N/A | 2 | 2 | 2 | 3 | 2 | 2 | 2 | 2 |  |  |
|  |  | Delivery Lead Time (Sat) | Number | N | N/A | Delivery Lead Time (Sat) |  |  |  |  |  | 2 | 2 | 2 | 2 | N/A | N/A | N/A | 2 | 2 | 2 | N/A | N/A | 2 | 2 | 2 | 3 | 2 | 2 | 2 | N/A | N/A | 2 | 3 | 2 | N/A | N/A | 2 | 2 | 2 | 3 | 2 | 2 | 2 | 2 |  |  |
|  |  | Delivery Lead Time (Sun) | Number | N | N/A | Delivery Lead Time (Sun) |  |  |  |  |  | 3 | 3 | 3 | 3 | N/A | N/A | N/A | 3 | 3 | 3 | N/A | N/A | 2 | 2 | 2 | 3 | 2 | 2 | 3 | N/A | N/A | 2 | 3 | 3 | N/A | N/A | 2 | 2 | 2 | 3 | 2 | 2 | 3 | 3 |  |  |
|  |  | Importer Name(Thai) | Char | N | N/A | Importer Name(Thai) |  |  |  |  |  | บริษัท แอล ฟู๊ดส์ จำกัด | บริษัท แอล ฟู๊ดส์ จำกัด | บริษัท แอล ฟู๊ดส์ จำกัด | บริษัท แอล ฟู๊ดส์ จำกัด |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | Importer Name(English) | Char | N | N/A | Importer Name(English) |  |  |  |  |  | L Foods Co., Ltd. | L Foods Co., Ltd. | L Foods Co., Ltd. | L Foods Co., Ltd. |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | ※The following fields are displayed on the Retail Barcode (General) screen, and my understanding is that they will be generated from the import data. |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  | N/A |  |  | Unit Price （All） | N/A |  |  | 計算？ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
