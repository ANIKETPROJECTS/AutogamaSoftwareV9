const XLSX = require('xlsx');
const data = [
  {
    "Category Name": "Garware Matt",
    "Roll Name": "Test Roll 1",
    "Quantity (sqft)": 500
  },
  {
    "Category Name": "Garware Plus",
    "Roll Name": "Test Roll 2",
    "Quantity (sqft)": 300
  },
  {
    "Category Name": "Elite",
    "Roll Name": "Test Roll 3",
    "Quantity (sqft)": 200
  }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, "PPF Rolls");
XLSX.writeFile(wb, "test_files/ppf_import_test.xlsx");
console.log("Excel file created at test_files/ppf_import_test.xlsx");
