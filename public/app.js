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

// Function to display inventory items
function displayInventory() {
    const inventoryList = document.getElementById('inventoryList');
    db.ref('inventory').on('value', (snapshot) => {
        inventoryList.innerHTML = '';
        snapshot.forEach((child) => {
            const item = child.val();
            const itemKey = child.key; // Get Firebase key for this item
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.innerHTML = `
                <h3>${item.name}</h3>
                <p>Brand: ${item.brand}</p>
                <p>Color: ${item.color}</p>
                <p>Type: ${item.type}</p>
                <p>Stock: ${item.fiveGallons} × 5gal, ${item.singleGallons} × 1gal</p>
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
    document.getElementById('editFiveGallons').value = item.fiveGallons;
    document.getElementById('editSingleGallons').value = item.singleGallons;
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

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const addButton = document.getElementById('addButton');
    const scanButton = document.getElementById('scanButton');
    const reportsButton = document.getElementById('reportsButton');
    const addModal = document.getElementById('addModal');
    const scanModal = document.getElementById('scanModal');
    const reportsModal = document.getElementById('reportsModal');
    const addItemForm = document.getElementById('addItemForm');

    // Display current inventory
    displayInventory();

    // Add button click handler
    addButton.addEventListener('click', () => {
        console.log('Add button clicked');
        addModal.style.display = 'block';
    });

    // Form submission handler
    addItemForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted');

        const newItem = {
            name: document.getElementById('paintName').value,
            brand: document.getElementById('paintBrand').value,
            color: document.getElementById('paintColor').value,
            type: document.getElementById('paintType').value,
            fiveGallons: parseInt(document.getElementById('fiveGallons').value) || 0,
            singleGallons: parseInt(document.getElementById('singleGallons').value) || 0,
            timestamp: Date.now()
        };

        console.log('Adding new item:', newItem);

        // Add to Firebase
        db.ref('inventory').push(newItem)
            .then(() => {
                console.log('Item added successfully');
                addModal.style.display = 'none';
                addItemForm.reset();
                // displayInventory() is not needed here as the .on('value') listener will update automatically
            })
            .catch((error) => {
                console.error('Error adding item:', error);
                alert('Error adding item. Please try again.');
            });
    });

    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            console.log('Close button clicked');
            addModal.style.display = 'none';
            scanModal.style.display = 'none';
            reportsModal.style.display = 'none';
        });
    });

    // Other button handlers
    scanButton.addEventListener('click', () => {
        console.log('Scan button clicked');
        scanModal.style.display = 'block';
        initializeScanner();
    });

    reportsButton.addEventListener('click', () => {
        console.log('Reports button clicked');
        reportsModal.style.display = 'block';
    });

    // Edit form submission handler
    const editForm = document.getElementById('editItemForm');
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const itemKey = this.dataset.itemKey;
        const updatedItem = {
            name: document.getElementById('editPaintName').value,
            brand: document.getElementById('editPaintBrand').value,
            color: document.getElementById('editPaintColor').value,
            type: document.getElementById('editPaintType').value,
            fiveGallons: parseInt(document.getElementById('editFiveGallons').value) || 0,
            singleGallons: parseInt(document.getElementById('editSingleGallons').value) || 0,
            barcode: document.getElementById('editBarcode').value,
            timestamp: Date.now()
        };

        // Update in Firebase
        db.ref('inventory/' + itemKey).update(updatedItem)
            .then(() => {
                document.getElementById('editModal').style.display = 'none';
                alert('Item updated successfully!');
            })
            .catch((error) => {
                console.error('Error updating item:', error);
                alert('Error updating item. Please try again.');
            });
    });

    // Update cancel button handler
    document.querySelector('.cancel-edit').addEventListener('click', function() {
        const editModal = document.getElementById('editModal');
        editModal.style.display = 'none';
        if (typeof Quagga !== 'undefined') {
            Quagga.stop();
        }
    });

    // Add barcode scan button handler
    document.getElementById('scanEditBarcode').addEventListener('click', function(e) {
        e.preventDefault();
        initializeEditScanner();
    });

    // Add delete button handler
    document.getElementById('deleteItem').addEventListener('click', function() {
        const itemKey = document.getElementById('editItemForm').dataset.itemKey;
        if (confirm('Are you sure you want to delete this item?')) {
            db.ref('inventory/' + itemKey).remove()
                .then(() => {
                    document.getElementById('editModal').style.display = 'none';
                    alert('Item deleted successfully!');
                })
                .catch((error) => {
                    console.error('Error deleting item:', error);
                    alert('Error deleting item. Please try again.');
                });
        }
    });
});

// DOM Elements - declare all at once at the top
const scannerModal = document.getElementById('scannerModal');
const quantityModal = document.getElementById('quantityModal');
const searchBar = document.getElementById('searchBar');
const scannedItemDetails = document.getElementById('scannedItemDetails');
const confirmItem = document.getElementById('confirmItem');
const cancelScan = document.getElementById('cancelScan');

// Add new DOM elements
const newItemModal = document.getElementById('newItemModal');
const newItemForm = document.getElementById('newItemForm');
const cancelNewItem = document.getElementById('cancelNewItem');
const reportsModal = document.getElementById('reportsModal');
const closeReports = document.getElementById('closeReports');
const exportReport = document.getElementById('exportReport');
const filterDates = document.getElementById('filterDates');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');

// Scanner Configuration
function initializeScanner() {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector("#interactive"),
            constraints: {
                facingMode: "environment"  // Use back camera on mobile
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

    // Handle successful scans
    Quagga.onDetected(function(result) {
        const code = result.codeResult.code;
        console.log("Barcode detected:", code);
        
        // Display the scanned code
        document.getElementById('scanResult').textContent = `Barcode: ${code}`;
        
        // Stop scanning
        Quagga.stop();
        
        // Look up the paint in your database or prompt to add new
        lookupPaint(code);
    });
}

// Function to look up paint by barcode
function lookupPaint(barcode) {
    db.ref('inventory').orderByChild('barcode').equalTo(barcode).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                // Paint exists in database
                const paint = Object.values(snapshot.val())[0];
                alert(`Found: ${paint.name} (${paint.brand})`);
            } else {
                // Paint not found - prompt to add
                if (confirm('Paint not found. Would you like to add it?')) {
                    // Pre-fill barcode in add form
                    document.getElementById('scanModal').style.display = 'none';
                    const addModal = document.getElementById('addModal');
                    addModal.style.display = 'block';
                    // You might want to add a barcode field to your form
                }
            }
        })
        .catch((error) => {
            console.error("Error looking up paint:", error);
            alert('Error looking up paint. Please try again.');
        });
}

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
                    <td>${item.fiveGallons} × 5gal, ${item.singleGallons} × 1gal</td>
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

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    if (searchTerm.length < 2) return; // Only search for 2 or more characters
    
    db.ref('inventory').orderByChild('name')
        .once('value')
        .then((snapshot) => {
            const items = [];
            snapshot.forEach((child) => {
                const item = child.val();
                if (
                    item.name.toLowerCase().includes(searchTerm) ||
                    item.brand.toLowerCase().includes(searchTerm) ||
                    item.color.toLowerCase().includes(searchTerm) ||
                    item.upc.includes(searchTerm)
                ) {
                    items.push(item);
                }
            });
            displaySearchResults(items);
        });
}

function displaySearchResults(items) {
    const resultsHtml = items.map(item => `
        <div class="search-result">
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>${item.brand} - ${item.color}</p>
                <p>Stock: ${item.fiveGallons} × 5gal, ${item.singleGallons} × 1gal</p>
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