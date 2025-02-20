// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyACy1Eyd5CjMeHBx54KHX76TeCkCHpO7tM",
    authDomain: "inven-295db.firebaseapp.com",
    projectId: "inven-295db",
    storageBucket: "inven-295db.firebasestorage.app",
    messagingSenderId: "351899872423",
    appId: "1:351899872423:web:3aa3c07d1dec23adf03f82",
    measurementId: "G-0FD6BEHC90",
    databaseURL: "https://inven-295db-default-rtdb.firebaseio.com"
};

// Initialize Firebase and create db variable in global scope
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Add this at the top with other global variables
let knownBrands = new Set();
let currentBarcode = '';

// Function to display inventory items
function displayInventory() {
    const inventoryList = document.getElementById('inventoryList');
    db.ref('inventory').on('value', (snapshot) => {
        inventoryList.innerHTML = '';
        snapshot.forEach((child) => {
            const item = child.val();
            const itemKey = child.key;
            
            // Calculate total volume including partials
            const fiveGallons = item.fiveGallons || 0;
            const twoGallons = item.twoGallons || 0;
            const singleGallons = item.singleGallons || 0;
            const quarts = item.quarts || 0;
            const pints = item.pints || 0;
            const fiveGallonPartialsQty = item.fiveGallonPartialsQty || 0;
            const twoGallonPartialsQty = item.twoGallonPartialsQty || 0;
            const singleGallonPartialsQty = item.singleGallonPartialsQty || 0;
            
            const totalVolume = (fiveGallons * 5) + 
                              (twoGallons * 2) + 
                              (singleGallons * 1) + 
                              (quarts * 0.25) + 
                              (pints * 0.125) +
                              (fiveGallonPartialsQty * 5) +
                              (twoGallonPartialsQty * 2) +
                              (singleGallonPartialsQty * 1);

            // Create partials text
            const partialsText = [];
            if (item.fiveGallonPartials && fiveGallonPartialsQty > 0) {
                partialsText.push(`${fiveGallonPartialsQty} × 5gal`);
            }
            if (item.twoGallonPartials && twoGallonPartialsQty > 0) {
                partialsText.push(`${twoGallonPartialsQty} × 2gal`);
            }
            if (item.singleGallonPartials && singleGallonPartialsQty > 0) {
                partialsText.push(`${singleGallonPartialsQty} × 1gal`);
            }
            
            const partialsDisplay = partialsText.length > 0 ? 
                `<div class="partials-count">+${partialsText.join(', ')}</div>` : '';

            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.innerHTML = `
                <div class="quantity-wrapper">
                    <div class="item-quantity">${totalVolume}GAL</div>
                    ${partialsDisplay}
                </div>
                <h3>${item.name}</h3>
                <p>Brand: ${item.brand}</p>
                <p>Color: ${item.color}</p>
                <p>Type: ${item.type}</p>
                <p>Sheen: ${item.sheen || 'N/A'}</p>
                <p>Stock: ${fiveGallons} × 5gal${item.fiveGallonPartials ? ` + ${fiveGallonPartialsQty} partials` : ''}, 
                         ${twoGallons} × 2gal${item.twoGallonPartials ? ` + ${twoGallonPartialsQty} partials` : ''}, 
                         ${singleGallons} × 1gal${item.singleGallonPartials ? ` + ${singleGallonPartialsQty} partials` : ''}, 
                         ${quarts} × qt, 
                         ${pints} × pt</p>
            `;
            
            itemDiv.addEventListener('click', () => {
                openEditModal(itemKey, item);
            });
            
            inventoryList.appendChild(itemDiv);
        });
    });
}

// Function to open edit modal with item data
function openEditModal(itemKey, item) {
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editItemForm');
    
    // Set form values
    document.getElementById('editPaintName').value = item.name;
    document.getElementById('editPaintBrand').value = item.brand;
    document.getElementById('editPaintColor').value = item.color;
    document.getElementById('editPaintType').value = item.type;
    document.getElementById('editPaintSheen').value = item.sheen;
    document.getElementById('editFiveGallons').value = item.fiveGallons || 0;
    document.getElementById('editTwoGallons').value = item.twoGallons || 0;
    document.getElementById('editSingleGallons').value = item.singleGallons || 0;
    document.getElementById('editQuarts').value = item.quarts || 0;
    document.getElementById('editPints').value = item.pints || 0;
    
    // Set partials checkboxes and quantities
    document.getElementById('editFiveGallonPartials').checked = item.fiveGallonPartials || false;
    document.getElementById('editTwoGallonPartials').checked = item.twoGallonPartials || false;
    document.getElementById('editSingleGallonPartials').checked = item.singleGallonPartials || false;
    
    document.getElementById('editFiveGallonPartialsQty').value = item.fiveGallonPartialsQty || 0;
    document.getElementById('editTwoGallonPartialsQty').value = item.twoGallonPartialsQty || 0;
    document.getElementById('editSingleGallonPartialsQty').value = item.singleGallonPartialsQty || 0;
    
    // Show/hide partial quantity inputs based on checkboxes
    document.getElementById('editFiveGallonPartialsQty').style.display = item.fiveGallonPartials ? 'inline-block' : 'none';
    document.getElementById('editTwoGallonPartialsQty').style.display = item.twoGallonPartials ? 'inline-block' : 'none';
    document.getElementById('editSingleGallonPartialsQty').style.display = item.singleGallonPartials ? 'inline-block' : 'none';
    
    editForm.dataset.itemKey = itemKey;
    editModal.style.display = 'block';
}

// Initialize barcode scanner for edit modal
function initializeEditScanner() {
    const scannerDiv = document.getElementById('editBarcodeScanner');
    scannerDiv.style.display = 'block';
    
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector("#editInteractive"),
            constraints: {
                facingMode: "environment"
            },
        },
        decoder: {
            readers: [
                "ean_reader",
                "ean_8_reader",
                "upc_reader",
                "upc_e_reader"
            ]
        }
    }, function(err) {
        if (err) {
            console.error("Scanner initialization failed:", err);
            alert("Failed to start scanner. Please check camera permissions.");
            return;
        }
        console.log("Scanner initialized successfully");
        Quagga.start();
    });

    Quagga.onDetected(function(result) {
        const code = result.codeResult.code;
        console.log("Barcode detected:", code);
        
        // Update barcode input
        document.getElementById('editBarcode').value = code;
        
        // Stop scanning
        Quagga.stop();
        scannerDiv.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase
    const db = firebase.database();

    // Get DOM elements
    const addButton = document.getElementById('addButton');
    const scanButton = document.getElementById('scanButton');
    const reportsButton = document.getElementById('reportsButton');
    const addModal = document.getElementById('addModal');
    const scanModal = document.getElementById('scanModal');
    const reportsModal = document.getElementById('reportsModal');
    const addItemForm = document.getElementById('addItemForm');

    // Button click handlers
    addButton.addEventListener('click', () => {
        addModal.style.display = 'block';
    });

    scanButton.addEventListener('click', () => {
        const scanModal = document.getElementById('scanModal');
        const barcodeInput = document.getElementById('barcodeInput');
        const scanResult = document.getElementById('scanResult');
        const noMatchOptions = document.getElementById('noMatchOptions');
        
        // Reset everything
        scanResult.innerHTML = '';
        noMatchOptions.style.display = 'none';
        barcodeInput.value = '';
        currentBarcode = '';
        
        // Show modal and focus input
        scanModal.style.display = 'block';
        barcodeInput.focus();

        // Handle barcode input
        barcodeInput.addEventListener('input', function() {
            setTimeout(() => {
                const barcode = this.value.trim();
                if (barcode) {
                    currentBarcode = barcode;
                    
                    db.ref('inventory').orderByChild('barcode').equalTo(barcode).once('value')
                        .then((snapshot) => {
                            if (snapshot.exists()) {
                                snapshot.forEach((child) => {
                                    const item = child.val();
                                    if (scanResult) {
                                        scanResult.innerHTML = `
                                            <div class="scan-result-item">
                                                <div class="item-info">
                                                    <h3>${item.name}</h3>
                                                    <p>Brand: ${item.brand}</p>
                                                    <p>Color: ${item.color}</p>
                                                    <p>Type: ${item.type}</p>
                                                    <p>Sheen: ${item.sheen || 'N/A'}</p>
                                                </div>
                                                
                                                <div class="quick-adjust">
                                                    <div class="quantity-row">
                                                        <span>5 Gallon:</span>
                                                        <button onclick="adjustQuantity('${child.key}', 'fiveGallons', -1, event)" class="qty-btn">-</button>
                                                        <span class="quantity-value">${item.fiveGallons || 0}</span>
                                                        <button onclick="adjustQuantity('${child.key}', 'fiveGallons', 1, event)" class="qty-btn">+</button>
                                                    </div>
                                                    
                                                    <div class="quantity-row">
                                                        <span>2 Gallon:</span>
                                                        <button onclick="adjustQuantity('${child.key}', 'twoGallons', -1, event)" class="qty-btn">-</button>
                                                        <span class="quantity-value">${item.twoGallons || 0}</span>
                                                        <button onclick="adjustQuantity('${child.key}', 'twoGallons', 1, event)" class="qty-btn">+</button>
                                                    </div>
                                                    
                                                    <div class="quantity-row">
                                                        <span>1 Gallon:</span>
                                                        <button onclick="adjustQuantity('${child.key}', 'singleGallons', -1, event)" class="qty-btn">-</button>
                                                        <span class="quantity-value">${item.singleGallons || 0}</span>
                                                        <button onclick="adjustQuantity('${child.key}', 'singleGallons', 1, event)" class="qty-btn">+</button>
                                                    </div>
                                                    
                                                    <div class="quantity-row">
                                                        <span>Quarts:</span>
                                                        <button onclick="adjustQuantity('${child.key}', 'quarts', -1, event)" class="qty-btn">-</button>
                                                        <span class="quantity-value">${item.quarts || 0}</span>
                                                        <button onclick="adjustQuantity('${child.key}', 'quarts', 1, event)" class="qty-btn">+</button>
                                                    </div>
                                                    
                                                    <div class="quantity-row">
                                                        <span>Pints:</span>
                                                        <button onclick="adjustQuantity('${child.key}', 'pints', -1, event)" class="qty-btn">-</button>
                                                        <span class="quantity-value">${item.pints || 0}</span>
                                                        <button onclick="adjustQuantity('${child.key}', 'pints', 1, event)" class="qty-btn">+</button>
                                                    </div>
                                                </div>
                                                
                                                <div class="scan-actions">
                                                    <button onclick="openEditModal('${child.key}', ${JSON.stringify(item)})" class="edit-button">
                                                        Full Edit
                                                    </button>
                                                </div>
                                            </div>
                                        `;
                                    }
                                });
                            } else {
                                if (noMatchOptions) {
                                    noMatchOptions.style.display = 'block';
                                }
                            }
                        })
                        .catch((error) => {
                            console.error('Error searching for barcode:', error);
                            if (scanResult) {
                                scanResult.innerHTML = '<p class="error">Error searching for item</p>';
                            }
                        });
                }
            }, 100);
        });
    });

    reportsButton.addEventListener('click', () => {
        reportsModal.style.display = 'block';
    });

    // Close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            addModal.style.display = 'none';
            scanModal.style.display = 'none';
            reportsModal.style.display = 'none';
            Quagga.stop();
        });
    });

    // Display inventory with correct gallon calculations
    function displayInventory() {
        const inventoryList = document.getElementById('inventoryList');
        db.ref('inventory').on('value', (snapshot) => {
            inventoryList.innerHTML = '';
            snapshot.forEach((child) => {
                const item = child.val();
                const itemKey = child.key;
                
                // Calculate total volume including partials
                const fiveGallons = item.fiveGallons || 0;
                const twoGallons = item.twoGallons || 0;
                const singleGallons = item.singleGallons || 0;
                const quarts = item.quarts || 0;
                const pints = item.pints || 0;
                const fiveGallonPartialsQty = item.fiveGallonPartialsQty || 0;
                const twoGallonPartialsQty = item.twoGallonPartialsQty || 0;
                const singleGallonPartialsQty = item.singleGallonPartialsQty || 0;
                
                const totalVolume = (fiveGallons * 5) + 
                                  (twoGallons * 2) + 
                                  (singleGallons * 1) + 
                                  (quarts * 0.25) + 
                                  (pints * 0.125) +
                                  (fiveGallonPartialsQty * 5) +
                                  (twoGallonPartialsQty * 2) +
                                  (singleGallonPartialsQty * 1);

                // Create partials text
                const partialsText = [];
                if (item.fiveGallonPartials && fiveGallonPartialsQty > 0) {
                    partialsText.push(`${fiveGallonPartialsQty} × 5gal`);
                }
                if (item.twoGallonPartials && twoGallonPartialsQty > 0) {
                    partialsText.push(`${twoGallonPartialsQty} × 2gal`);
                }
                if (item.singleGallonPartials && singleGallonPartialsQty > 0) {
                    partialsText.push(`${singleGallonPartialsQty} × 1gal`);
                }
                
                const partialsDisplay = partialsText.length > 0 ? 
                    `<div class="partials-count">+${partialsText.join(', ')}</div>` : '';

                const itemDiv = document.createElement('div');
                itemDiv.className = 'inventory-item';
                itemDiv.innerHTML = `
                    <div class="quantity-wrapper">
                        <div class="item-quantity">${totalVolume}GAL</div>
                        ${partialsDisplay}
                    </div>
                    <h3>${item.name}</h3>
                    <p>Brand: ${item.brand}</p>
                    <p>Color: ${item.color}</p>
                    <p>Type: ${item.type}</p>
                    <p>Sheen: ${item.sheen || 'N/A'}</p>
                    <p>Stock: ${fiveGallons} × 5gal${item.fiveGallonPartials ? ` + ${fiveGallonPartialsQty} partials` : ''}, 
                             ${twoGallons} × 2gal${item.twoGallonPartials ? ` + ${twoGallonPartialsQty} partials` : ''}, 
                             ${singleGallons} × 1gal${item.singleGallonPartials ? ` + ${singleGallonPartialsQty} partials` : ''}, 
                             ${quarts} × qt, 
                             ${pints} × pt</p>
                `;
                
                itemDiv.addEventListener('click', () => {
                    openEditModal(itemKey, item);
                });
                
                inventoryList.appendChild(itemDiv);
            });
        });
    }

    // Initialize display
    displayInventory();
    setupFilterAndSort();
    setupSearch();

    // Add these event listeners for the edit modal
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editItemForm');
    
    // Cancel button in edit modal
    document.querySelector('.cancel-edit').addEventListener('click', function() {
        editModal.style.display = 'none';
        editForm.reset();
    });

    // Update the edit form submission handler
    document.getElementById('editItemForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const itemKey = this.dataset.itemKey;
        const editModal = document.getElementById('editModal');
        
        // First, get the current item data
        db.ref('inventory').child(itemKey).once('value', (snapshot) => {
            const currentItem = snapshot.val();
            
            // Create updated item, preserving existing quantities
            const updatedItem = {
                name: document.getElementById('editPaintName').value,
                brand: document.getElementById('editPaintBrand').value,
                color: document.getElementById('editPaintColor').value,
                type: document.getElementById('editPaintType').value,
                sheen: document.getElementById('editPaintSheen').value,
                
                // Quantities - use new value if entered, otherwise keep existing
                fiveGallons: parseInt(document.getElementById('editFiveGallons').value) || currentItem.fiveGallons || 0,
                twoGallons: parseInt(document.getElementById('editTwoGallons').value) || currentItem.twoGallons || 0,
                singleGallons: parseInt(document.getElementById('editSingleGallons').value) || currentItem.singleGallons || 0,
                quarts: parseInt(document.getElementById('editQuarts').value) || currentItem.quarts || 0,
                pints: parseInt(document.getElementById('editPints').value) || currentItem.pints || 0,
                
                // Partials checkboxes
                fiveGallonPartials: document.getElementById('editFiveGallonPartials').checked,
                twoGallonPartials: document.getElementById('editTwoGallonPartials').checked,
                singleGallonPartials: document.getElementById('editSingleGallonPartials').checked,
                
                // Partial quantities
                fiveGallonPartialsQty: parseInt(document.getElementById('editFiveGallonPartialsQty').value) || 0,
                twoGallonPartialsQty: parseInt(document.getElementById('editTwoGallonPartialsQty').value) || 0,
                singleGallonPartialsQty: parseInt(document.getElementById('editSingleGallonPartialsQty').value) || 0,
                
                // Add timestamp
                timestamp: Date.now()
            };

            // Update in Firebase
            db.ref('inventory').child(itemKey).update(updatedItem)
                .then(() => {
                    console.log('Successfully updated item');
                    editModal.style.display = 'none';
                    this.reset();
                })
                .catch((error) => {
                    console.error('Error updating item:', error);
                    alert('Error updating item. Please try again.');
                });
        });
    });

    // Delete button in edit modal
    document.getElementById('deleteItem').addEventListener('click', function() {
        const itemKey = editForm.dataset.itemKey;
        if (itemKey && confirm('Are you sure you want to delete this item?')) {
            db.ref('inventory').child(itemKey).remove()
                .then(() => {
                    editModal.style.display = 'none';
                    editForm.reset();
                })
                .catch((error) => {
                    console.error('Error deleting item:', error);
                    alert('Error deleting item. Please try again.');
                });
        }
    });

    // Close modal if clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === editModal) {
            editModal.style.display = 'none';
            editForm.reset();
        }
    });

    // Add this function to handle partial quantity toggles
    function setupPartialQuantities() {
        // For add form
        const fiveGallonPartialsCheck = document.getElementById('fiveGallonPartials');
        const fiveGallonPartialsQty = document.getElementById('fiveGallonPartialsQty');
        const singleGallonPartialsCheck = document.getElementById('singleGallonPartials');
        const singleGallonPartialsQty = document.getElementById('singleGallonPartialsQty');

        // For edit form
        const editFiveGallonPartialsCheck = document.getElementById('editFiveGallonPartials');
        const editFiveGallonPartialsQty = document.getElementById('editFiveGallonPartialsQty');
        const editSingleGallonPartialsCheck = document.getElementById('editSingleGallonPartials');
        const editSingleGallonPartialsQty = document.getElementById('editSingleGallonPartialsQty');

        // Add two gallon partials
        const twoGallonPartialsCheck = document.getElementById('twoGallonPartials');
        const twoGallonPartialsQty = document.getElementById('twoGallonPartialsQty');
        const editTwoGallonPartialsCheck = document.getElementById('editTwoGallonPartials');
        const editTwoGallonPartialsQty = document.getElementById('editTwoGallonPartialsQty');

        // Add form listeners
        if (fiveGallonPartialsCheck && fiveGallonPartialsQty) {
            fiveGallonPartialsCheck.addEventListener('change', function() {
                fiveGallonPartialsQty.style.display = this.checked ? 'inline-block' : 'none';
                if (!this.checked) fiveGallonPartialsQty.value = 0;
            });
        }

        if (singleGallonPartialsCheck && singleGallonPartialsQty) {
            singleGallonPartialsCheck.addEventListener('change', function() {
                singleGallonPartialsQty.style.display = this.checked ? 'inline-block' : 'none';
                if (!this.checked) singleGallonPartialsQty.value = 0;
            });
        }

        // Edit form listeners
        if (editFiveGallonPartialsCheck && editFiveGallonPartialsQty) {
            editFiveGallonPartialsCheck.addEventListener('change', function() {
                editFiveGallonPartialsQty.style.display = this.checked ? 'inline-block' : 'none';
                if (!this.checked) editFiveGallonPartialsQty.value = 0;
            });
        }

        if (editSingleGallonPartialsCheck && editSingleGallonPartialsQty) {
            editSingleGallonPartialsCheck.addEventListener('change', function() {
                editSingleGallonPartialsQty.style.display = this.checked ? 'inline-block' : 'none';
                if (!this.checked) editSingleGallonPartialsQty.value = 0;
            });
        }

        // Add event listeners for two gallon partials
        if (twoGallonPartialsCheck && twoGallonPartialsQty) {
            twoGallonPartialsCheck.addEventListener('change', function() {
                twoGallonPartialsQty.style.display = this.checked ? 'inline-block' : 'none';
                if (!this.checked) twoGallonPartialsQty.value = 0;
            });
        }

        if (editTwoGallonPartialsCheck && editTwoGallonPartialsQty) {
            editTwoGallonPartialsCheck.addEventListener('change', function() {
                editTwoGallonPartialsQty.style.display = this.checked ? 'inline-block' : 'none';
                if (!this.checked) editTwoGallonPartialsQty.value = 0;
            });
        }
    }

    setupPartialQuantities();

    // Add this to where you handle paint type changes
    document.getElementById('paintType').addEventListener('change', function() {
        const plasticOptions = document.getElementById('plasticOptions');
        const regularQuantity = document.getElementById('quantity');
        
        if (this.value.toLowerCase() === 'plastic') {
            plasticOptions.style.display = 'block';
            regularQuantity.style.display = 'none';
            toggleRollQuantity();
        } else {
            plasticOptions.style.display = 'none';
            regularQuantity.style.display = 'block';
        }
    });

    // Just the new plastic-related code
    document.getElementById('paintType').addEventListener('change', function() {
        const plasticOptions = document.getElementById('plasticOptions');
        const regularQuantity = document.getElementById('quantity');
        
        if (this.value.toLowerCase() === 'plastic') {
            plasticOptions.style.display = 'block';
            regularQuantity.style.display = 'none';
            toggleRollQuantity();
        } else {
            plasticOptions.style.display = 'none';
            regularQuantity.style.display = 'block';
        }
    });

    displayLogs();
});

// DOM Elements - declare all at once at the top
const scannerModal = document.getElementById('scannerModal');
const quantityModal = document.getElementById('quantityModal');
const scannedItemDetails = document.getElementById('scannedItemDetails');
const confirmItem = document.getElementById('confirmItem');
const cancelScan = document.getElementById('cancelScan');

// Add new DOM elements
const newItemModal = document.getElementById('newItemModal');
const newItemForm = document.getElementById('newItemForm');
const cancelNewItem = document.getElementById('cancelNewItem');
const closeReports = document.getElementById('closeReports');
const exportReport = document.getElementById('exportReport');
const filterDates = document.getElementById('filterDates');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');

// Replace with the original simple scanner setup
document.getElementById('scanButton').addEventListener('click', function() {
    const scanModal = document.getElementById('scanModal');
    scanModal.style.display = 'block';

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector("#interactive"),
            constraints: {
                facingMode: "environment"
            },
        },
        decoder: {
            readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"]
        }
    }, function(err) {
        if (err) {
            console.error(err);
            alert("Error starting scanner");
            return;
        }
        console.log("Scanner started successfully");
        Quagga.start();
    });

    Quagga.onDetected(function(result) {
        console.log("Barcode detected:", result.codeResult.code);
        Quagga.stop();
        scanModal.style.display = 'none';
    });
});

// Keep the basic close functionality for the scan modal
document.querySelector('.close-modal').addEventListener('click', function() {
    Quagga.stop();
    document.getElementById('scanModal').style.display = 'none';
});

// Load reports
function loadReports() {
    console.log('Loading reports');
    const reportsRef = db.ref('inventory');
    reportsRef.once('value')
        .then((snapshot) => {
            const tbody = document.getElementById('reportsTableBody');
            tbody.innerHTML = '';
            snapshot.forEach((child) => {
                const item = child.val();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(item.timestamp).toLocaleDateString()}</td>
                    <td>${item.name}</td>
                    <td>${item.brand}</td>
                    <td>${item.fiveGallons} × 5gal, ${item.singleGallons} × 1gal, ${item.quarts} × qt, ${item.pints} × pt</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading reports:', error);
        });
}

let lastScannedCode = null;

function startScanning() {
    scannerModal.style.display = 'block';
    Quagga.init(scannerConfig, function(err) {
        if (err) {
            console.error('Scanner initialization failed:', err);
            return;
        }
        Quagga.start();
    });

    Quagga.onDetected(handleScan);
}

function handleScan(result) {
    const code = result.codeResult.code;
    lastScannedCode = code;
    
    // Stop scanning once we get a result
    Quagga.stop();
    
    // Check if item exists in database
    checkItemInDatabase(code);
}

function checkItemInDatabase(code) {
    db.ref('inventory/' + code).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                // Show confirmation with existing item details
                const item = snapshot.val();
                showItemConfirmation(item);
            } else {
                // Show new item entry form
                showNewItemForm(code);
            }
        })
        .catch((error) => {
            console.error('Database check failed:', error);
        });
}

function showItemConfirmation(item) {
    document.getElementById('scanConfirmation').style.display = 'block';
    scannedItemDetails.innerHTML = `
        <p>Name: ${item.name}</p>
        <p>Brand: ${item.brand}</p>
        <p>Color: ${item.color}</p>
        <p>Type: ${item.type}</p>
    `;
}

function showNewItemForm(code) {
    newItemModal.style.display = 'block';
    scannerModal.style.display = 'none';
    lastScannedCode = code;
}

function closeNewItemModal() {
    newItemModal.style.display = 'none';
    lastScannedCode = null;
    newItemForm.reset();
}

function handleNewItemSubmit(event) {
    event.preventDefault();
    
    const newItem = {
        name: document.getElementById('paintName').value,
        brand: document.getElementById('paintBrand').value,
        color: document.getElementById('paintColor').value,
        type: document.getElementById('paintType').value,
        upc: lastScannedCode,
        fiveGallons: 0,
        singleGallons: 0
    };
    
    // Save to database
    db.ref('inventory/' + lastScannedCode).set(newItem)
        .then(() => {
            closeNewItemModal();
            showQuantityModal();
        })
        .catch((error) => {
            console.error('Error saving new item:', error);
            alert('Failed to save new item. Please try again.');
        });
}

function handleConfirmItem() {
    document.getElementById('scanConfirmation').style.display = 'none';
    showQuantityModal();
}

function showQuantityModal() {
    newItemModal.style.display = 'none';
    quantityModal.style.display = 'block';
    
    // Clear previous values
    document.getElementById('fiveGallons').value = '';
    document.getElementById('singleGallons').value = '';
}

function closeScannerModal() {
    scannerModal.style.display = 'none';
    Quagga.stop();
}

function displaySearchResults(items) {
    const resultsHtml = items.map(item => `
        <div class="search-result">
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>${item.brand} - ${item.color}</p>
                <p>Stock: ${item.fiveGallons} × 5gal, ${item.singleGallons} × 1gal, ${item.quarts} × qt, ${item.pints} × pt</p>
            </div>
        </div>
    `).join('');
    
    document.getElementById('inventoryList').innerHTML = resultsHtml;
}

// Helper function to format timestamp
function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
}

// Helper function to update inventory
function updateInventory(code, quantities) {
    const updates = {};
    updates[`/inventory/${code}/fiveGallons`] = quantities.fiveGallons;
    updates[`/inventory/${code}/singleGallons`] = quantities.singleGallons;
    
    // Add to activity log
    const logEntry = {
        action: 'add',
        upc: code,
        fiveGallons: quantities.fiveGallons,
        singleGallons: quantities.singleGallons,
        timestamp: Date.now()
    };
    
    updates[`/activity_log/${Date.now()}`] = logEntry;
    
    return db.ref().update(updates);
}

// Reports functionality
function showReports() {
    reportsModal.style.display = 'block';
    loadReports();
}

function closeReportsModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('reportsModal'));
    if (modal) {
        modal.hide();
    }
}

// Also add click handler for the close button
document.querySelector('#reportsModal .btn-close').addEventListener('click', closeReportsModal);
document.querySelector('#reportsModal .btn-secondary').addEventListener('click', closeReportsModal);

function loadReports(startTimestamp = null, endTimestamp = null) {
    let query = db.ref('activity_log').orderByChild('timestamp');
    
    if (startTimestamp) {
        query = query.startAt(startTimestamp);
    }
    if (endTimestamp) {
        query = query.endAt(endTimestamp);
    }
    
    query.once('value')
        .then((snapshot) => {
            const reports = [];
            snapshot.forEach((child) => {
                reports.unshift(child.val()); // Add to beginning for reverse chronological order
            });
            displayReports(reports);
        });
}

function displayReports(reports) {
    const tbody = document.getElementById('reportsTableBody');
    tbody.innerHTML = reports.map(report => `
        <tr>
            <td>${formatTimestamp(report.timestamp)}</td>
            <td>${report.action}</td>
            <td>${report.paintInfo || 'UPC: ' + report.upc}</td>
            <td>${report.fiveGallons}</td>
            <td>${report.singleGallons}</td>
        </tr>
    `).join('');
}

function filterReportsByDate() {
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    end.setHours(23, 59, 59, 999); // End of day
    
    loadReports(start.getTime(), end.getTime());
}

function exportToCSV() {
    const table = document.getElementById('reportsTable');
    let csv = [];
    
    // Add headers
    const headers = Array.from(table.querySelectorAll('th'))
        .map(th => `"${th.textContent}"`);
    csv.push(headers.join(','));
    
    // Add rows
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const rowData = Array.from(row.querySelectorAll('td'))
            .map(td => `"${td.textContent}"`);
        csv.push(rowData.join(','));
    });
    
    // Create and download CSV file
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Add this function to update known brands
function updateKnownBrands() {
    db.ref('inventory').once('value', (snapshot) => {
        snapshot.forEach((child) => {
            const item = child.val();
            if (item.brand) {
                knownBrands.add(item.brand);
            }
        });
        
        // Update datalist
        const brandDatalist = document.getElementById('knownBrands');
        brandDatalist.innerHTML = Array.from(knownBrands)
            .map(brand => `<option value="${brand}">`)
            .join('');
    });
}

// Add this helper function to handle item display
function displayInventoryItem(itemKey, item, container) {
    // Your existing item display logic here
    const fiveGallons = item.fiveGallons || 0;
    const twoGallons = item.twoGallons || 0;
    const singleGallons = item.singleGallons || 0;
    const quarts = item.quarts || 0;
    const pints = item.pints || 0;
    const fiveGallonPartialsQty = item.fiveGallonPartialsQty || 0;
    const singleGallonPartialsQty = item.singleGallonPartialsQty || 0;
    
    const totalVolume = (fiveGallons * 5) + 
                      (twoGallons * 2) +
                      (singleGallons * 1) + 
                      (quarts * 0.25) + 
                      (pints * 0.125);
    
    const partialsText = [];
    if (item.fiveGallonPartials && fiveGallonPartialsQty > 0) {
        partialsText.push(`${fiveGallonPartialsQty} × 5gal`);
    }
    if (item.singleGallonPartials && singleGallonPartialsQty > 0) {
        partialsText.push(`${singleGallonPartialsQty} × 1gal`);
    }
    const partialsDisplay = partialsText.length > 0 ? 
        `<div class="partials-count">+${partialsText.join(', ')}</div>` : '';

    const itemDiv = document.createElement('div');
    itemDiv.className = 'inventory-item';
    itemDiv.innerHTML = `
        <div class="quantity-wrapper">
            <div class="item-quantity">${totalVolume}GAL</div>
            ${partialsDisplay}
        </div>
        <h3>${item.name}</h3>
        <p>Brand: ${item.brand}</p>
        <p>Color: ${item.color}</p>
        <p>Type: ${item.type}</p>
        <p>Sheen: ${item.sheen || 'N/A'}</p>
        <p>Stock: ${fiveGallons} × 5gal${item.fiveGallonPartials ? ` + ${fiveGallonPartialsQty} partials` : ''}, 
                 ${twoGallons} × 2gal${item.twoGallonPartials ? ` + ${twoGallonPartialsQty} partials` : ''}, 
                 ${singleGallons} × 1gal${item.singleGallonPartials ? ` + ${singleGallonPartialsQty} partials` : ''}, 
                 ${quarts} × qt, 
                 ${pints} × pt</p>
    `;
    
    itemDiv.addEventListener('click', () => {
        openEditModal(itemKey, item);
    });
    
    container.appendChild(itemDiv);
}

// Add this function to handle filtering and sorting
function setupFilterAndSort() {
    const filterType = document.getElementById('filterType');
    const filterSheen = document.getElementById('filterSheen');
    const sortBy = document.getElementById('sortBy');

    function applyFilterAndSort() {
        const typeFilter = filterType.value;
        const sheenFilter = filterSheen.value;
        const sortValue = sortBy.value;

        db.ref('inventory').once('value', (snapshot) => {
            let items = [];
            snapshot.forEach((child) => {
                items.push({...child.val(), key: child.key});
            });

            // Apply filters
            items = items.filter(item => {
                const matchesType = !typeFilter || item.type === typeFilter;
                const matchesSheen = !sheenFilter || item.sheen === sheenFilter;
                return matchesType && matchesSheen;
            });

            // Apply sorting
            items.sort((a, b) => {
                switch(sortValue) {
                    case 'name':
                        return (a.name || '').localeCompare(b.name || '');
                    case 'brand':
                        return (a.brand || '').localeCompare(b.brand || '');
                    case 'type':
                        return (a.type || '').localeCompare(b.type || '');
                    case 'quantity':
                        const getTotal = (item) => {
                            return (item.fiveGallons || 0) * 5 + 
                                   (item.singleGallons || 0) + 
                                   (item.quarts || 0) * 0.25 + 
                                   (item.pints || 0) * 0.125;
                        };
                        return getTotal(b) - getTotal(a); // Highest first
                    case 'newest':
                        return (b.timestamp || 0) - (a.timestamp || 0);
                    case 'oldest':
                        return (a.timestamp || 0) - (b.timestamp || 0);
                    default:
                        return 0;
                }
            });

            // Update display
            const inventoryList = document.getElementById('inventoryList');
            inventoryList.innerHTML = '';
            items.forEach(item => {
                // Use existing display logic
                const fiveGallons = item.fiveGallons || 0;
                const twoGallons = item.twoGallons || 0;
                const singleGallons = item.singleGallons || 0;
                const quarts = item.quarts || 0;
                const pints = item.pints || 0;
                const fiveGallonPartialsQty = item.fiveGallonPartialsQty || 0;
                const singleGallonPartialsQty = item.singleGallonPartialsQty || 0;
                
                const totalVolume = (fiveGallons * 5) + 
                                  (twoGallons * 2) +
                                  (singleGallons * 1) + 
                                  (quarts * 0.25) + 
                                  (pints * 0.125);
                
                const partialsText = [];
                if (item.fiveGallonPartials && fiveGallonPartialsQty > 0) {
                    partialsText.push(`${fiveGallonPartialsQty} × 5gal`);
                }
                if (item.singleGallonPartials && singleGallonPartialsQty > 0) {
                    partialsText.push(`${singleGallonPartialsQty} × 1gal`);
                }
                const partialsDisplay = partialsText.length > 0 ? 
                    `<div class="partials-count">+${partialsText.join(', ')}</div>` : '';

                const itemDiv = document.createElement('div');
                itemDiv.className = 'inventory-item';
                itemDiv.innerHTML = `
                    <div class="quantity-wrapper">
                        <div class="item-quantity">${totalVolume}GAL</div>
                        ${partialsDisplay}
                    </div>
                    <h3>${item.name}</h3>
                    <p>Brand: ${item.brand}</p>
                    <p>Color: ${item.color}</p>
                    <p>Type: ${item.type}</p>
                    <p>Sheen: ${item.sheen || 'N/A'}</p>
                    <p>Stock: ${fiveGallons} × 5gal${item.fiveGallonPartials ? ` + ${fiveGallonPartialsQty} partials` : ''}, 
                             ${twoGallons} × 2gal${item.twoGallonPartials ? ` + ${twoGallonPartialsQty} partials` : ''}, 
                             ${singleGallons} × 1gal${item.singleGallonPartials ? ` + ${singleGallonPartialsQty} partials` : ''}, 
                             ${quarts} × qt, 
                             ${pints} × pt</p>
                `;
                
                itemDiv.addEventListener('click', () => {
                    openEditModal(item.key, item);
                });
                
                inventoryList.appendChild(itemDiv);
            });
        });
    }

    // Add event listeners
    filterType.addEventListener('change', applyFilterAndSort);
    filterSheen.addEventListener('change', applyFilterAndSort);
    sortBy.addEventListener('change', applyFilterAndSort);
}

// Update the duplicate check function
function checkForDuplicate(newItem) {
    return new Promise((resolve, reject) => {
        db.ref('inventory').once('value', (snapshot) => {
            let isDuplicate = false;
            snapshot.forEach((child) => {
                const item = child.val();
                // Check if name, brand, color AND sheen all match
                if (item.name.toLowerCase() === newItem.name.toLowerCase() &&
                    item.brand.toLowerCase() === newItem.brand.toLowerCase() &&
                    item.color.toLowerCase() === newItem.color.toLowerCase() &&
                    item.sheen.toLowerCase() === newItem.sheen.toLowerCase()) {
                    isDuplicate = true;
                }
            });
            resolve(isDuplicate);
        });
    });
}

// Update the add form submission handler
addItemForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const newItem = {
        name: document.getElementById('paintName').value,
        brand: document.getElementById('paintBrand').value,
        color: document.getElementById('paintColor').value,
        type: document.getElementById('paintType').value,
        sheen: document.getElementById('paintSheen').value,
        fiveGallons: parseInt(document.getElementById('fiveGallons').value) || 0,
        singleGallons: parseInt(document.getElementById('singleGallons').value) || 0,
        quarts: parseInt(document.getElementById('quarts').value) || 0,
        pints: parseInt(document.getElementById('pints').value) || 0,
        fiveGallonPartials: document.getElementById('fiveGallonPartials').checked,
        singleGallonPartials: document.getElementById('singleGallonPartials').checked,
        fiveGallonPartialsQty: parseInt(document.getElementById('fiveGallonPartialsQty').value) || 0,
        singleGallonPartialsQty: parseInt(document.getElementById('singleGallonPartialsQty').value) || 0,
        twoGallons: parseInt(document.getElementById('twoGallons').value) || 0,
        twoGallonPartials: document.getElementById('twoGallonPartials').checked,
        twoGallonPartialsQty: parseInt(document.getElementById('twoGallonPartialsQty').value) || 0,
        timestamp: Date.now()
    };

    // Check for exact duplicates (including sheen)
    const isDuplicate = await checkForDuplicate(newItem);
    if (isDuplicate) {
        alert('This exact paint (including sheen) already exists in the inventory!');
        return;
    }

    // If not a duplicate, add to database
    db.ref('inventory').push(newItem)
        .then(() => {
            addModal.style.display = 'none';
            addItemForm.reset();
            createLog(
                'Item Added',
                newItem.name,
                `Added ${newItem.fiveGallons} × 5gal, ${newItem.singleGallons} × 1gal, ${newItem.quarts} × qt, ${newItem.pints} × pt`
            );
        })
        .catch((error) => {
            console.error('Error adding item:', error);
            alert('Error adding item. Please try again.');
        });
});

function setupSearch() {
    const searchBar = document.getElementById('searchBar');
    if (!searchBar) return;

    searchBar.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        db.ref('inventory').once('value', (snapshot) => {
            const inventoryList = document.getElementById('inventoryList');
            if (!inventoryList) return;
            
            inventoryList.innerHTML = '';
            
            snapshot.forEach((child) => {
                const item = child.val();
                const itemKey = child.key;
                
                const matchesSearch = 
                    (item.name || '').toLowerCase().includes(searchTerm) ||
                    (item.brand || '').toLowerCase().includes(searchTerm) ||
                    (item.color || '').toLowerCase().includes(searchTerm) ||
                    (item.type || '').toLowerCase().includes(searchTerm) ||
                    (item.sheen || '').toLowerCase().includes(searchTerm);
                
                if (searchTerm === '' || matchesSearch) {
                    // Use the existing displayInventoryItem function
                    const fiveGallons = item.fiveGallons || 0;
                    const twoGallons = item.twoGallons || 0;
                    const singleGallons = item.singleGallons || 0;
                    const quarts = item.quarts || 0;
                    const pints = item.pints || 0;
                    const fiveGallonPartialsQty = item.fiveGallonPartialsQty || 0;
                    const singleGallonPartialsQty = item.singleGallonPartialsQty || 0;
                    
                    const totalVolume = (fiveGallons * 5) + 
                                      (twoGallons * 2) +
                                      (singleGallons * 1) + 
                                      (quarts * 0.25) + 
                                      (pints * 0.125);
                    
                    const partialsText = [];
                    if (item.fiveGallonPartials && fiveGallonPartialsQty > 0) {
                        partialsText.push(`${fiveGallonPartialsQty} × 5gal`);
                    }
                    if (item.singleGallonPartials && singleGallonPartialsQty > 0) {
                        partialsText.push(`${singleGallonPartialsQty} × 1gal`);
                    }
                    const partialsDisplay = partialsText.length > 0 ? 
                        `<div class="partials-count">+${partialsText.join(', ')}</div>` : '';

                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'inventory-item';
                    itemDiv.innerHTML = `
                        <div class="quantity-wrapper">
                            <div class="item-quantity">${totalVolume}GAL</div>
                            ${partialsDisplay}
                        </div>
                        <h3>${item.name}</h3>
                        <p>Brand: ${item.brand}</p>
                        <p>Color: ${item.color}</p>
                        <p>Type: ${item.type}</p>
                        <p>Sheen: ${item.sheen || 'N/A'}</p>
                        <p>Stock: ${fiveGallons} × 5gal${item.fiveGallonPartials ? ` + ${fiveGallonPartialsQty} partials` : ''}, 
                                 ${twoGallons} × 2gal${item.twoGallonPartials ? ` + ${twoGallonPartialsQty} partials` : ''}, 
                                 ${singleGallons} × 1gal${item.singleGallonPartials ? ` + ${singleGallonPartialsQty} partials` : ''}, 
                                 ${quarts} × qt, 
                                 ${pints} × pt</p>
                    `;
                    
                    itemDiv.addEventListener('click', () => {
                        openEditModal(itemKey, item);
                    });
                    
                    inventoryList.appendChild(itemDiv);
                }
            });
        });
    });
}

// Add this function to open add modal with barcode
function openAddModal(barcode) {
    const addModal = document.getElementById('addModal');
    const scanModal = document.getElementById('scanModal');
    const barcodeInput = document.getElementById('barcode');
    
    scanModal.style.display = 'none';
    addModal.style.display = 'block';
    
    if (barcodeInput) {
        barcodeInput.value = barcode;
    }
}

// Update close modal handler
document.querySelector('.close-modal').addEventListener('click', function() {
    document.getElementById('scanModal').style.display = 'none';
    document.getElementById('scanStatus').textContent = 'Waiting for scan...';
    document.getElementById('scanResult').innerHTML = '';
});

// Function to open link barcode modal
function openLinkBarcodeModal(barcode) {
    const linkModal = document.getElementById('linkBarcodeModal');
    const scanModal = document.getElementById('scanModal');
    const searchInput = document.getElementById('linkSearchInput');
    const resultsDiv = document.getElementById('linkSearchResults');
    
    scanModal.style.display = 'none';
    linkModal.style.display = 'block';
    searchInput.focus();
    
    // Handle search input
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        db.ref('inventory').once('value', (snapshot) => {
            resultsDiv.innerHTML = '';
            snapshot.forEach((child) => {
                const item = child.val();
                if (item.name.toLowerCase().includes(searchTerm) ||
                    item.brand.toLowerCase().includes(searchTerm) ||
                    item.color.toLowerCase().includes(searchTerm)) {
                    
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'search-result-item';
                    itemDiv.innerHTML = `
                        <div class="item-details">
                            <h4>${item.name}</h4>
                            <p>${item.brand} - ${item.color}</p>
                            <p>Sheen: ${item.sheen || 'N/A'}</p>
                        </div>
                        <button onclick="linkBarcodeToItem('${child.key}', '${barcode}')" class="link-button">
                            Link Barcode
                        </button>
                    `;
                    
                    resultsDiv.appendChild(itemDiv);
                }
            });
        });
    });
}

// Function to link barcode to existing item
function linkBarcodeToItem(itemKey, barcode) {
    console.log('Linking barcode:', barcode, 'to item:', itemKey); // Debug log
    
    db.ref(`inventory/${itemKey}`).update({
        barcode: barcode
    }).then(() => {
        // Close both modals
        document.getElementById('linkBarcodeModal').style.display = 'none';
        document.getElementById('scanModal').style.display = 'none';
        alert('Barcode linked successfully!');
        
        // Optional: Refresh the inventory display
        displayInventory();
    }).catch((error) => {
        console.error('Error linking barcode:', error);
        alert('Error linking barcode. Please try again.');
    });
}

// Update the adjustQuantity function with better error handling and logging
function adjustQuantity(itemKey, field, change, event) {
    // Add debug logging
    console.log('Adjusting quantity:', {itemKey, field, change});
    
    // Get the database reference
    const itemRef = db.ref(`inventory/${itemKey}`);
    
    // Get current value and update
    itemRef.once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                throw new Error('Item not found');
            }
            
            const item = snapshot.val();
            console.log('Current item:', item);
            
            const currentValue = parseInt(item[field]) || 0;
            const newValue = Math.max(0, currentValue + change);
            
            console.log('Values:', {currentValue, newValue});
            
            // Update the value
            return itemRef.update({
                [field]: newValue,
                timestamp: Date.now()
            });
        })
        .then(() => {
            console.log('Update successful');
            
            // Update the display
            const button = event.target;
            const quantityElement = button.parentElement.querySelector('.quantity-value');
            if (quantityElement) {
                const currentDisplayValue = parseInt(quantityElement.textContent) || 0;
                const newDisplayValue = Math.max(0, currentDisplayValue + change);
                quantityElement.textContent = newDisplayValue;
            }
            
            // Refresh inventory display
            displayInventory();
        })
        .catch((error) => {
            console.error('Error in adjustQuantity:', error);
            alert('Error updating quantity. Please try again.');
        });
}

// Add this function to handle showing/hiding quantity fields
function toggleRollQuantity() {
    const rollType = document.getElementById('rollType').value;
    const fullRollDiv = document.getElementById('fullRollQuantity');
    const partialRollDiv = document.getElementById('partialRollQuantity');
    
    if (rollType === 'full') {
        fullRollDiv.style.display = 'block';
        partialRollDiv.style.display = 'none';
    } else {
        fullRollDiv.style.display = 'none';
        partialRollDiv.style.display = 'block';
    }
}

// Add this helper function to get current date and time
function getCurrentDateTime() {
    return new Date().toLocaleString();
}

// Add this function to create logs
function createLog(action, itemName, details) {
    return db.collection('logs').add({
        timestamp: new Date().toLocaleString(),
        action: action,
        itemName: itemName,
        details: details,
        date: new Date()  // for sorting
    })
    .then(() => {
        console.log('Log created successfully');  // Debug message
    })
    .catch(error => {
        console.error('Error creating log:', error);  // Debug message
    });
}

// Modify your addItem function
function addItem(e) {
    e.preventDefault();
    
    const name = document.getElementById('paintName').value;
    const type = document.getElementById('paintType').value;
    const quantity = document.getElementById('quantity').value;
    
    db.collection('inventory').add({
        name: name,
        type: type,
        quantity: quantity
    }).then(() => {
        createLog(
            'Item Added',
            name,
            `Added ${quantity} of ${type}`
        );
        // Reset form and update UI as needed
    });
}

// Modify your deleteItem function
function deleteItem(id) {
    db.collection('inventory').doc(id).get().then((doc) => {
        const item = doc.data();
        db.collection('inventory').doc(id).delete().then(() => {
            createLog(
                'Item Deleted',
                item.name,
                `Deleted item with quantity ${item.quantity}`
            );
        });
    });
}

// Modify your updateQuantity function
function updateQuantity(id, oldQuantity) {
    const newQuantity = document.getElementById('newQuantity').value;
    
    db.collection('inventory').doc(id).get().then((doc) => {
        const item = doc.data();
        db.collection('inventory').doc(id).update({
            quantity: newQuantity
        }).then(() => {
            createLog(
                'Quantity Update',
                item.name,
                `Changed quantity from ${oldQuantity} to ${newQuantity}`
            );
            // Close modal or update UI as needed
        });
    });
}

// Add this function to display logs
function displayLogs() {
    const logsList = document.getElementById('logsList');
    if (!logsList) {
        console.error('Logs container not found');  // Debug message
        return;
    }

    db.collection('logs')
        .orderBy('date', 'desc')
        .limit(50)
        .onSnapshot((snapshot) => {
            logsList.innerHTML = '';
            snapshot.forEach((doc) => {
                const log = doc.data();
                logsList.innerHTML += `
                    <div class="list-group-item">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">${log.action}</h6>
                            <small>${log.timestamp}</small>
                        </div>
                        <p class="mb-1">${log.itemName} - ${log.details}</p>
                    </div>
                `;
            });
        });
}

// Modify your existing Reports button click handler
document.querySelector('.reports-btn').addEventListener('click', function() {
    // Get the modal
    const modal = new bootstrap.Modal(document.getElementById('reportsModal'));
    
    // Clear previous logs
    const logsContainer = document.getElementById('logsList');
    logsContainer.innerHTML = '';
    
    // Fetch and display logs
    db.collection('logs')
        .orderBy('date', 'desc')
        .limit(50)
        .get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                const log = doc.data();
                logsContainer.innerHTML += `
                    <div class="list-group-item">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">${log.action}</h6>
                            <small>${log.timestamp}</small>
                        </div>
                        <p class="mb-1">${log.itemName} - ${log.details}</p>
                    </div>
                `;
            });
        });
    
    // Show the modal
    modal.show();
}); 