const XLSX = require('xlsx');

const data = [
  {
    Name: 'Test Accessory 1',
    Category: 'Headgear',
    Quantity: 10,
    Unit: 'Piece',
    Price: 1500
  },
  {
    Name: 'Test Accessory 2',
    Category: 'Electronics',
    Quantity: 5,
    Unit: 'Piece',
    Price: 3000
  },
  {
    Name: 'Microfiber Cloth',
    Category: 'Cleaning',
    Quantity: 50,
    Unit: 'Pack',
    Price: 200
  }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, "Accessories");
XLSX.writeFile(wb, "public/test_accessories.xlsx");
console.log("Test file created at public/test_accessories.xlsx");
