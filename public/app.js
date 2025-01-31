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

// Function to display inventory items
function displayInventory() {
    const inventoryList = document.getElementById('inventoryList');
    db.ref('inventory').on('value', (snapshot) => {
        inventoryList.innerHTML = '';
        snapshot.forEach((child) => {
            const item = child.val();
            const itemKey = child.key;
            
            // Calculate total volume in gallons, using 0 for undefined values
            const fiveGallons = item.fiveGallons || 0;
            const singleGallons = item.singleGallons || 0;
            const quarts = item.quarts || 0;
            const pints = item.pints || 0;
            const fiveGallonPartialsQty = item.fiveGallonPartialsQty || 0;
            const singleGallonPartialsQty = item.singleGallonPartialsQty || 0;
            
            const totalVolume = (fiveGallons * 5) + 
                              (singleGallons * 1) + 
                              (quarts * 0.25) + 
                              (pints * 0.125);
            
            // Create partials text only if there are partials
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
                         ${singleGallons} × 1gal${item.singleGallonPartials ? ` + ${singleGallonPartialsQty} partials` : ''}, 
                         ${quarts} × qt, 
                         ${pints} × pt</p>
            `;
            
            // Add click handler to open edit modal
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
    
    // Fill form with current values
    document.getElementById('editPaintName').value = item.name;
    document.getElementById('editPaintBrand').value = item.brand;
    document.getElementById('editPaintColor').value = item.color;
    document.getElementById('editPaintType').value = item.type;
    document.getElementById('editPaintSheen').value = item.sheen || '';
    document.getElementById('editFiveGallons').value = item.fiveGallons;
    document.getElementById('editSingleGallons').value = item.singleGallons;
    document.getElementById('editQuarts').value = item.quarts || 0;
    document.getElementById('editPints').value = item.pints || 0;
    document.getElementById('editBarcode').value = item.barcode || '';
    
    // Store the item key in the form
    editForm.dataset.itemKey = itemKey;
    
    // Show the modal
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
        scanModal.style.display = 'block';
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
                
                // Calculate total volume in gallons
                const fiveGallons = item.fiveGallons || 0;
                const singleGallons = item.singleGallons || 0;
                const quarts = item.quarts || 0;
                const pints = item.pints || 0;
                const fiveGallonPartialsQty = item.fiveGallonPartialsQty || 0;
                const singleGallonPartialsQty = item.singleGallonPartialsQty || 0;
                
                const totalVolume = (fiveGallons * 5) + 
                                  (singleGallons * 1) + 
                                  (quarts * 0.25) + 
                                  (pints * 0.125);
                
                // Create partials text
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

    // Save changes in edit modal
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const itemKey = this.dataset.itemKey;
        const updatedItem = {
            name: document.getElementById('editPaintName').value,
            brand: document.getElementById('editPaintBrand').value,
            color: document.getElementById('editPaintColor').value,
            type: document.getElementById('editPaintType').value,
            sheen: document.getElementById('editPaintSheen').value,
            fiveGallons: parseInt(document.getElementById('editFiveGallons').value) || 0,
            singleGallons: parseInt(document.getElementById('editSingleGallons').value) || 0,
            quarts: parseInt(document.getElementById('editQuarts').value) || 0,
            pints: parseInt(document.getElementById('editPints').value) || 0,
            barcode: document.getElementById('editBarcode').value,
            fiveGallonPartials: document.getElementById('editFiveGallonPartials').checked,
            singleGallonPartials: document.getElementById('editSingleGallonPartials').checked,
            fiveGallonPartialsQty: parseInt(document.getElementById('editFiveGallonPartialsQty').value) || 0,
            singleGallonPartialsQty: parseInt(document.getElementById('editSingleGallonPartialsQty').value) || 0,
            timestamp: Date.now()
        };

        // Update the item in Firebase
        db.ref('inventory').child(itemKey).update(updatedItem)
            .then(() => {
                editModal.style.display = 'none';
                editForm.reset();
            })
            .catch((error) => {
                console.error('Error updating item:', error);
                alert('Error updating item. Please try again.');
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
    reportsModal.style.display = 'none';
}

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
    const singleGallons = item.singleGallons || 0;
    const quarts = item.quarts || 0;
    const pints = item.pints || 0;
    const fiveGallonPartialsQty = item.fiveGallonPartialsQty || 0;
    const singleGallonPartialsQty = item.singleGallonPartialsQty || 0;
    
    const totalVolume = (fiveGallons * 5) + 
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
                const singleGallons = item.singleGallons || 0;
                const quarts = item.quarts || 0;
                const pints = item.pints || 0;
                const fiveGallonPartialsQty = item.fiveGallonPartialsQty || 0;
                const singleGallonPartialsQty = item.singleGallonPartialsQty || 0;
                
                const totalVolume = (fiveGallons * 5) + 
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

// Add this function to check for duplicates
function checkForDuplicate(newItem) {
    return new Promise((resolve, reject) => {
        db.ref('inventory').once('value', (snapshot) => {
            let isDuplicate = false;
            snapshot.forEach((child) => {
                const item = child.val();
                if (item.name.toLowerCase() === newItem.name.toLowerCase() &&
                    item.brand.toLowerCase() === newItem.brand.toLowerCase() &&
                    item.color.toLowerCase() === newItem.color.toLowerCase()) {
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
        timestamp: Date.now()
    };

    // Check for duplicates before adding
    const isDuplicate = await checkForDuplicate(newItem);
    if (isDuplicate) {
        alert('This paint already exists in the inventory!');
        return;
    }

    // If not a duplicate, add to database
    db.ref('inventory').push(newItem)
        .then(() => {
            document.getElementById('addModal').style.display = 'none';
            addItemForm.reset();
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
                    const singleGallons = item.singleGallons || 0;
                    const quarts = item.quarts || 0;
                    const pints = item.pints || 0;
                    const fiveGallonPartialsQty = item.fiveGallonPartialsQty || 0;
                    const singleGallonPartialsQty = item.singleGallonPartialsQty || 0;
                    
                    const totalVolume = (fiveGallons * 5) + 
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