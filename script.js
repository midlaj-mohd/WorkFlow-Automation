// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, doc, query, where, addDoc, getDoc, updateDoc, deleteDoc, increment, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";


// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCkINrXS7OfPosTvQWAoOugszwwU-JA5B0",
    authDomain: "testing-f3aef.firebaseapp.com",
    projectId: "testing-f3aef",
    storageBucket: "testing-f3aef.firebasestorage.app",
    messagingSenderId: "967947590241",
    appId: "1:967947590241:web:95158fb7e28b91115b6820",
    measurementId: "G-RRR17VXGHB"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


//Add work


// Function to open the popup
function openPopup() {
    const popup = document.getElementById("popup");
    popup.style.display = "flex"; // Use flex to center it
}

// Function to close the popup
function closePopup() {
    const popup = document.getElementById("popup");
    popup.style.display = "none";
}

// Add work details to Firestore with auto-generated document ID
async function addWorkToFirestore(workData) {
    try {
        // Add the work data under a new auto-generated document ID
        const jobsCollection = collection(db, "jobs");
        await setDoc(doc(jobsCollection), {
            ...workData, // Include all the work data
            status: "pending" // Add the status field
        });

        alert("Work added successfully!");
        closePopup();
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Failed to add work. Please try again.");
    }
}

// Check if we are on "dashboard.html"
if (window.location.pathname.includes("dashboard.html")) {
    // Attach event listeners only on dashboard.html
    document.addEventListener("DOMContentLoaded", () => {
        // Open popup on "+ Add Work" card click
        const addWorkCard = document.querySelector(".job-card:nth-child(3)"); // Select the 3rd job card
        if (addWorkCard) {
            addWorkCard.addEventListener("click", openPopup);
        }

        // Close popup on clicking outside the popup content
        const popup = document.getElementById("popup");
        if (popup) {
            popup.addEventListener("click", (event) => {
                if (event.target === popup) {
                    closePopup();
                }
            });
        }

        // Close popup on clicking the close button
        const closePopupBtn = document.querySelector(".close-btn");
        if (closePopupBtn) {
            closePopupBtn.addEventListener("click", closePopup);
        }

        // Handle form submission
        const addWorkForm = document.getElementById("add-work-form");
        if (addWorkForm) {
            addWorkForm.addEventListener("submit", (event) => {
                event.preventDefault(); // Prevent default form submission

                // Extract form data
                const workNum = parseFloat(document.getElementById("work-num").value);
                const workName = document.getElementById("work-name").value;
                const place = document.getElementById("place").value;
                const date = document.getElementById("date").value;
                const estimate = parseFloat(document.getElementById("estimate").value);
                const details = document.getElementById("details").value;

                // Create work data object
                const workData = {
                    workNum,
                    workName,
                    place,
                    date,
                    estimate,
                    details,
                };

                // Add work data to Firestore
                addWorkToFirestore(workData);

                // Reset the form
                addWorkForm.reset();
                closePopup();
            });
        }
    });
} else {
}


// Pending Work




// Ensure the script only runs on pendingwork.html
if (window.location.pathname.includes("pendingwork.html")) {
    // Function to fetch and display works with status = "pending"
    async function getTotalExpense(workId) {
        const detailsCollectionRef = collection(db, `jobs/${workId}/details`);
        const querySnapshot = await getDocs(detailsCollectionRef);
    
        let totalExpense = 0;
    
        querySnapshot.forEach(doc => {
            const data = doc.data();
            for (let key in data) {
                if (!["dayNumber", "Date"].includes(key)) {
                    const value = parseFloat(data[key]);
                    if (!isNaN(value)) {
                        totalExpense += value;
                    }
                }
            }
        });
    
        return totalExpense;
    }
    
    async function fetchAndDisplayWorks() {
        try {
            const worksCollection = collection(db, "jobs");
            const pendingWorksQuery = query(
                worksCollection, 
                where("status", "==", "pending"), 
                orderBy("workNum", "asc") // Orders by workNum in ascending order
            );
            const querySnapshot = await getDocs(pendingWorksQuery);
            const workList = document.getElementById("work-list");
            const totalExpenseDisplay = document.getElementById("total-pending-expense"); // Create this element in HTML
    
            // Clear any existing content
            workList.innerHTML = "";
    
            let totalPendingExpense = 0; // Initialize total pending expense
    
            if (querySnapshot.empty) {
                workList.innerHTML = `<p>No pending works found.</p>`;
                totalExpenseDisplay.innerHTML = "Total Pending Expense: ₹0.00"; // Show 0 if no pending works
                return;
            }
    
            // Iterate through Firestore documents with status = "pending"
            for (const docSnapshot of querySnapshot.docs) {
                const work = docSnapshot.data();
                const workId = docSnapshot.id;
                let formattedDate = work.date ? new Date(work.date).toLocaleDateString("en-GB") : "N/A";
    
                // Fetch total expense for this work
                const totalExpense = await getTotalExpense(workId);
                totalPendingExpense += totalExpense; // Add to total pending expense sum
    
                const workCard = document.createElement("section");
                workCard.classList.add("card");
    
                workCard.innerHTML = `
                    <h2>Work ${work.workNum} - ${work.workName} ${work.place || "N/A"}</h2>
                    <p>Details: ${work.details || "No details available"}</p>
                    <p>Date: ${formattedDate}</p>
                    <p>Estimate: ₹${work.estimate || "0.00"}</p>
                    <p>Total Expense: ₹${totalExpense.toFixed(2)}</p>
    
                    <div class="card-actions">
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </div>
                `;
    
                // Select the buttons and add event listeners
                const editButton = workCard.querySelector(".edit-btn");
                const deleteButton = workCard.querySelector(".delete-btn");
    
                // Edit button functionality
                editButton.addEventListener("click", (event) => {
                    event.stopPropagation(); // Prevent the card click event
                    openEditPopup(workId, work); // Open edit popup with the work data
                });
    
                // Delete button functionality
                deleteButton.addEventListener("click", async (event) => {
                    event.stopPropagation(); // Prevent the card click event from firing
    
                    const confirmed = window.confirm("Are you sure you want to delete this work?");
                    if (confirmed) {
                        try {
                            const workDocRef = doc(db, "jobs", workId);
                            const detailsCollectionRef = collection(db, `jobs/${workId}/details`);
    
                            // Fetch all documents in the subcollection
                            const detailsSnapshot = await getDocs(detailsCollectionRef);
    
                            // Delete all documents in the subcollection
                            const deletePromises = detailsSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
                            await Promise.all(deletePromises);
    
                            // Delete the document from Firestore
                            await deleteDoc(workDocRef);
    
                            // Remove the card from the DOM
                            workCard.remove();
    
                            // Recalculate and update total expense
                            fetchAndDisplayWorks();
    
                        } catch (error) {
                            console.error("Error deleting work:", error);
                            alert("Failed to delete the work. Please try again.");
                        }
                    }
                });
    
                // Redirect to details page on card click
                workCard.addEventListener("click", () => {
                    window.location.href = `workDetails.html?id=${workId}`;
                });
    
                // Append the work card to the list
                workList.appendChild(workCard);
            }
    
            // Display the total pending work expenses
            totalExpenseDisplay.innerHTML = `Total Expense: ₹${totalPendingExpense.toFixed(2)}`;
    
        } catch (error) {
            console.error("Error fetching works: ", error);
            workList.innerHTML = `<p>Failed to load works. Please try again later.</p>`;
        }
    }
    
    

    // Function to open the edit popup
    function openEditPopup(workId, workData) {
        const popup = document.getElementById("editpopup");
        const editForm = document.getElementById("edit-form");

        if (!popup || !editForm) {
            console.error("Popup or form not found in the DOM.");
            return;
        }

        // Populate the form fields with the existing work data
        document.getElementById("edit-work-num").value = workData.workNum || "";
        document.getElementById("edit-work-name").value = workData.workName || "";
        document.getElementById("edit-place").value = workData.place || "";
        document.getElementById("edit-date").value = workData.date || "";
        document.getElementById("edit-estimate").value = workData.estimate || "";
        document.getElementById("edit-details").value = workData.details || "";

        // Attach work ID to the form for submission
        editForm.setAttribute("data-edit-id", workId);

        // Display the popup
        popup.style.display = "block";
    }

    // Function to close the popup
    function closeEditPopup() {
        const popup = document.getElementById("editpopup");
        const editForm = document.getElementById("edit-form");

        if (popup) popup.style.display = "none";
        if (editForm) editForm.removeAttribute("data-edit-id");
    }

    // Function to update the work in Firestore
    async function updateWorkInFirestore(workId, workData) {
        try {
            const workDocRef = doc(db, "jobs", workId);
            await updateDoc(workDocRef, workData);
            alert("Work updated successfully!");
            fetchAndDisplayWorks(); // Refresh the work list
        } catch (error) {
            console.error("Error updating work:", error);
            alert("Failed to update work. Please try again.");
        }
    }

    // Handle the edit form submission
    document.addEventListener("DOMContentLoaded", () => {
        const editForm = document.getElementById("edit-form");
        const closePopupBtn = document.getElementById("close-popup");

        if (editForm) {
            editForm.addEventListener("submit", async (event) => {
                event.preventDefault();

                const workId = editForm.getAttribute("data-edit-id");
                const workNum = document.getElementById("edit-work-num").value.trim();
                const workName = document.getElementById("edit-work-name").value.trim();
                const place = document.getElementById("edit-place").value.trim();
                const date = document.getElementById("edit-date").value.trim();
                const estimate = parseFloat(document.getElementById("edit-estimate").value) || 0;
                const details = document.getElementById("edit-details").value.trim();

                if (!workName || !place || !date) {
                    alert("Please fill out all required fields.");
                    return;
                }

                const updatedWorkData = { workNum, workName, place, date, estimate, details };

                if (workId) {
                    await updateWorkInFirestore(workId, updatedWorkData); // Update existing work
                }

                closeEditPopup(); // Close the popup after submission
            });
        }

        if (closePopupBtn) {
            closePopupBtn.addEventListener("click", closeEditPopup);
        }

        fetchAndDisplayWorks(); // Initial fetch
    });


} else {
}




// Days wise details


// Function to open the popup for adding a day
function openDayPopup() {
    const popup = document.getElementById("popup");
    popup.style.display = "flex"; // Use flex to center the popup
}

// Function to close the popup for adding a day
function closeDayPopup() {
    const popup = document.getElementById("popup");
    popup.style.display = "none"; // Hide the popup
}

// Attach event listeners
document.addEventListener("DOMContentLoaded", () => {
    // Get the "Add Day" card element
    const addDayCard = document.querySelector(".add-day");

    // Add click event listener to open the popup
    if (addDayCard) {
        addDayCard.addEventListener("click", openDayPopup);
    }

    // Get the close button in the popup
    const closePopupButton = document.getElementById("close-popup");

    // Add click event listener to close the popup
    if (closePopupButton) {
        closePopupButton.addEventListener("click", closeDayPopup);
    }

    // Add click listener to close the popup when clicking outside the popup content
    const popup = document.getElementById("popup");
    if (popup) {
        popup.addEventListener("click", (event) => {
            if (event.target === popup) {
                closeDayPopup();
            }
        });
    }
});

// Function to get the `workId` from the URL
function getWorkIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id"); // Extract the `id` parameter from the URL
}

// Function to add a day entry to the subcollection
async function addDayDetailsToFirestore(workId, dayData) {
    try {
        if (!workId) {
            throw new Error("Invalid work ID.");
        }

        const detailsCollection = collection(db, `jobs/${workId}/details`);

        // Get the current number of documents in the subcollection
        const querySnapshot = await getDocs(detailsCollection);
        const dayCount = querySnapshot.size; // Number of existing days

        // Add the new day data with the appropriate day number
        const dayNumber = dayCount + 1;
        const newDayData = { ...dayData, dayNumber }; // Add the day number to the data

        await addDoc(detailsCollection, newDayData);

        closeDayPopup(); // Close the popup
        location.reload(); // Reload the page to reflect changes
    } catch (error) {
        console.error("Error adding day details:", error);
        alert("Failed to add day details. Please try again.");
    }
}



// Enter button to next field

document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes("workDetails.html")) {
        const form = document.getElementById("add-day-form");

        form.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault(); // Prevent form submission

                // Get all input fields
                const inputs = Array.from(form.querySelectorAll("input"));
                const index = inputs.indexOf(event.target);

                // Move to the next input field if available
                if (index !== -1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            }
        });
    }
});


// Attach event listeners
document.addEventListener("DOMContentLoaded", () => {
    const workId = getWorkIdFromURL();

    // Object to store dynamic custom fields
    const customFields = {};

    // Add event listener to the "Save" button in the popup
    const addDayForm = document.getElementById("add-day-form");

    if (addDayForm) {
        addDayForm.addEventListener("submit", async (event) => {
            event.preventDefault(); // Prevent default form submission
        
            if (!workId) {
                alert("Invalid work ID. Cannot add details.");
                return;
            }
        
            try {

                // Extract date from the form
                const Date = document.getElementById("Date").value;

                // Extract salary data
                const Shahas = parseFloat(document.getElementById("Shahas").value) || 0;
                const Rafi = parseFloat(document.getElementById("Rafi").value) || 0;
                const Roni = parseFloat(document.getElementById("Roni").value) || 0;
                const Ishaque = parseFloat(document.getElementById("Ishaque").value) || 0;
                const Midlaj = parseFloat(document.getElementById("Midlaj").value) || 0;
        
                // Extract additional fields
                const food = parseFloat(document.getElementById("food").value) || 0;
                const transport = parseFloat(document.getElementById("transport").value) || 0;
        
                // Add dynamic custom fields
                const customFieldElements = document.querySelectorAll(".custom-field");
                customFieldElements.forEach((field) => {
                    const name = field.dataset.name;
                    const value = parseFloat(field.value) || field.value; // Parse if it's a number
                    if (name) customFields[name] = value;
                });
        
                // Create a flattened data structure for Firestore
                const dayData = {
                    Date,
                    Shahas,
                    Rafi,
                    Roni,
                    Ishaque,
                    Midlaj,
                    food,
                    transport,
                    ...customFields, // Spread custom fields into the main object
                };
        
                // Update balances for relevant salary fields
                const salaryData = { Shahas, Rafi, Roni, Ishaque, Midlaj };
                const updatePromises = [];
                for (let person in salaryData) {
                    const salaryAmount = salaryData[person];
                    if (salaryAmount > 0) {
                        updatePromises.push(updateSalaryBalance(person, salaryAmount));
                    }
                }
                await Promise.all(updatePromises);
        
                // Add the day data to Firestore
                await addDayDetailsToFirestore(workId, dayData);
        
                addDayForm.reset(); // Reset the form
            } catch (error) {
                console.error("Error submitting day details:", error);
                alert("Failed to submit day details. Please try again.");
            }
        });
        
        
        async function updateSalaryBalance(person, salaryAmount) {
            try {
                const salaryDocRef = doc(db, "salary", person);
        
                // Fetch the current document for the person
                const salaryDocSnapshot = await getDoc(salaryDocRef);
        
                // Default to 0 if the document does not exist
                let currentBalance = 0;
        
                if (salaryDocSnapshot.exists()) {
                    // Fetch the balance field from the document
                    currentBalance = parseFloat(salaryDocSnapshot.data().balance) || 0;
                } else {
                    console.warn(`${person} document does not exist in Firestore. Creating a new one.`);
                }
        
                // Sum the new salary with the current balance
                const newBalance = currentBalance + salaryAmount;
        
                // Update or create the document with the new balance using setDoc with merge option
                await setDoc(salaryDocRef, { balance: newBalance }, { merge: true });
        
            } catch (error) {
                console.error(`Error updating balance for ${person}:`, error);
                alert(`Failed to update balance for ${person}. Please try again.`);
            }
        }
        
    }

    // Handle the "Add Custom Field" button
    const addCustomFieldBtn = document.getElementById("addCustomFieldBtn");
    if (addCustomFieldBtn) {
        addCustomFieldBtn.addEventListener("click", () => {
            const customFieldName = document.getElementById("customFieldName").value.trim();
            const customFieldValue = document.getElementById("customFieldValue").value.trim();

            if (customFieldName && customFieldValue) {
                // Add the custom field to the customFields object
                customFields[customFieldName] = parseFloat(customFieldValue) || customFieldValue;

                // Display the custom fields added
                const customFieldList = document.getElementById("custom-fields-list");
                const newField = document.createElement("li");
                newField.textContent = `${customFieldName}: ${customFieldValue}`;
                customFieldList.appendChild(newField);

                // Reset the input fields for custom fields
                document.getElementById("customFieldName").value = "";
                document.getElementById("customFieldValue").value = "";
            } else {
                alert("Please enter both a custom field name and value.");
            }
        });
    }
});







//Day Card Loading

async function loadDayCards(workId) {
    const detailsCollectionRef = collection(db, `jobs/${workId}/details`);
    // Sort documents by 'dayNumber' or 'Date' in ascending order
    const sortedQuery = query(detailsCollectionRef, orderBy("dayNumber", "asc")); // Use "asc" for ascending order
    const querySnapshot = await getDocs(sortedQuery);

    const detailsContainer = document.getElementById('details-container');
    detailsContainer.innerHTML = ''; // Clear existing content

    // Check if the query snapshot contains any documents
    if (!querySnapshot.empty) {
        querySnapshot.forEach(doc => {
            const data = doc.data(); // Document data for each day
            const dayId = doc.id; // Get the document ID
            const dayCard = document.createElement('div');
            dayCard.classList.add('card'); // Add your existing .card CSS class here

            // Convert Firestore Timestamp to human-readable date
            let formattedDate = data.Date ? new Date(data.Date).toLocaleDateString("en-GB") : "N/A";

            let cardContent = `<h2>Day ${data.dayNumber || dayId} - ${formattedDate}</h2>`;

            // Initialize the sum variable
            let totalAmount = 0;

            // Loop through all fields dynamically
            for (let key in data) {
                // Exclude meta fields like `dayNumber` and `Date`
                if (!["dayNumber", "Date"].includes(key)) {
                    const value = parseFloat(data[key]); // Ensure numeric value
                    if (!isNaN(value) && value !== 0) {
                        cardContent += `<p>${key}: ${value}</p>`;
                        totalAmount += value; // Add to total amount
                    }
                }
            }

            // Add the sum of the amounts at the bottom of the card
            cardContent += `<p><strong>Total Amount: ${totalAmount}</strong></p>`;

            // Add Edit and Delete buttons
            cardContent += `
                <div class="card-actions">
                    <button class="edit-day-btn">Edit</button>
                    <button class="delete-day-btn">Delete</button>
                </div>`;

            // Add the dynamically generated content to the card
            dayCard.innerHTML = cardContent;

            // Add Edit button functionality
            const editButton = dayCard.querySelector('.edit-day-btn');
            editButton.addEventListener('click', () => openDayEditPopup(workId, dayId, data));

            // Add Delete button functionality
            const deleteButton = dayCard.querySelector('.delete-day-btn');
            deleteButton.addEventListener('click', async () => {
                const confirmed = window.confirm("Are you sure you want to delete this day's details?");
                if (confirmed) {
                    try {
                        // Get a reference to the collection
                        const detailsCollectionRef = collection(db, `jobs/${workId}/details`);

                        // Query the document by its unique ID
                        const q = query(detailsCollectionRef, where("__name__", "==", dayId)); // "__name__" refers to the document ID

                        // Execute the query to find the matching document
                        const querySnapshot = await getDocs(q);

                        if (querySnapshot.empty) {
                            console.error("No matching document found!");
                            alert("Failed to delete: Day details not found.");
                            return;
                        }

                        // Iterate through matching documents (should only be one in this case)
                        for (const docSnap of querySnapshot.docs) {
                            const dayData = docSnap.data(); // Fetch the day's data

                            // Update the balance for each member in the salary collection
                            const members = ['Shahas', 'Roni', 'Rafi', 'Ishaque', 'Midlaj'];
                            for (const member of members) {
                                if (dayData[member]) {
                                    const amount = parseFloat(dayData[member]) || 0;

                                    try {
                                        // Query the salary collection for the specific member
                                        const salaryCollectionRef = collection(db, 'salary');
                                        const q = query(salaryCollectionRef, where('__name__', '==', member)); // '__name__' matches the document ID

                                        // Execute the query to find the document
                                        const querySnapshot = await getDocs(q);

                                        if (!querySnapshot.empty) {
                                            querySnapshot.forEach(async (docSnap) => {
                                                const currentBalance = docSnap.data().balance || 0;

                                                // Update the balance field for the member
                                                const newBalance = currentBalance - amount;
                                                await updateDoc(docSnap.ref, { balance: newBalance });
                                                console.log(`Updated balance for ${member}: ${currentBalance} -> ${newBalance}`);
                                            });
                                        } else {
                                            console.error(`No salary document found for member: ${member}`);
                                        }
                                    } catch (error) {
                                        console.error(`Error updating balance for ${member}:`, error);
                                    }
                                }
                            }


                            // Delete the document from Firestore
                            await deleteDoc(docSnap.ref);
                            console.log(`Day details (ID: ${dayId}) deleted successfully.`);
                        }

                        // Remove the card from the DOM
                        dayCard.remove();
                        alert("Day details deleted successfully, and balances updated!");
                    } catch (error) {
                        console.error("Error deleting day details or updating balances:", error);
                        alert("Failed to delete day details. Please try again.");
                    }
                }
            });

            // Append the card to the container
            detailsContainer.appendChild(dayCard);
        });
    } else {
        // Display a message if no documents are found
        const noDataMessage = document.createElement('p');
        noDataMessage.textContent = 'No day details available.';
        detailsContainer.appendChild(noDataMessage);
    }

    // Add the "Add Day" card as the last card
    const addDayCard = document.createElement('div');
    addDayCard.classList.add('card'); // Add your existing .card CSS class
    addDayCard.style.margin = '0'; // Optional: remove margin to fit in the grid as other cards

    // Set the content of the "Add Day" button card as a large plus icon
    addDayCard.innerHTML = `<div class="add-day-icon">+</div>`;

    // Add click event to show popup when "Add Day" card is clicked
    addDayCard.addEventListener('click', openDayPopup);

    // Append the "Add Day" card to the container
    detailsContainer.appendChild(addDayCard);
}








// Function to open the edit popup for a specific day
function openDayEditPopup(workId, dayId, dayData) {
    const popup = document.getElementById('editpopupdaily');
    const editForm = document.getElementById('edit-day-form');

    if (!popup || !editForm) {
        console.error("Edit popup or form not found in the DOM.");
        return;
    }

    // Populate the form fields with the existing day data
    document.getElementById('edit-day-date').value = dayData.Date || "";
    document.getElementById('edit-day-number').value = dayData.dayNumber || "";

    // Loop through dayData to populate dynamic fields
    const dynamicFieldsContainer = document.getElementById('edit-dynamic-fields');
    dynamicFieldsContainer.innerHTML = ''; // Clear existing dynamic fields

    // List of fields you want to make non-clickable
    const disabledFields = ["food", "transport"]; // Example: Add fields you want to disable

    for (let key in dayData) {
        if (!["dayNumber", "Date"].includes(key)) {
            const fieldValue = dayData[key];

            // Add the disabled attribute conditionally if the field is in the disabledFields array
            const disabled = disabledFields.includes(key) ? 'disabled' : '';

            const fieldHTML = `
                <label for="edit-${key}">${key}</label>
                <input type="number" id="edit-${key}" name="${key}" value="${fieldValue}" ${disabled} />
            `;
            
            dynamicFieldsContainer.innerHTML += fieldHTML;
        }
    }


    // Attach day ID and work ID to the form for submission
    editForm.setAttribute('data-edit-work-id', workId);
    editForm.setAttribute('data-edit-day-id', dayId);

    // Display the popup
    popup.style.display = 'block';
}

// Function to close the edit day popup
function closeDayEditPopup() {
    const popup = document.getElementById('editpopupdaily');
    const editForm = document.getElementById('edit-day-form');

    if (popup) popup.style.display = 'none';
    if (editForm) {
        editForm.removeAttribute('data-edit-work-id');
        editForm.removeAttribute('data-edit-day-id');
    }
}

// Handle the edit form submission
async function handleEditDayFormSubmit(event) {
    event.preventDefault();

    const editForm = event.target;
    const workId = editForm.getAttribute('data-edit-work-id');
    const dayId = editForm.getAttribute('data-edit-day-id');

    if (!workId || !dayId) {
        alert("Invalid work or day ID.");
        return;
    }

    // Collect updated day data from the form
    const updatedDayData = {
        Date: document.getElementById('edit-day-date').value.trim(),
        dayNumber: parseInt(document.getElementById('edit-day-number').value.trim()) || 0,
    };

    // Collect dynamic fields
    const dynamicFieldsContainer = document.getElementById('edit-dynamic-fields');
    const inputs = dynamicFieldsContainer.querySelectorAll('input');

    let previousAmounts = {};
    let updatedAmounts = {};

    inputs.forEach(input => {
        const key = input.name;
        const value = parseFloat(input.value) || 0;
        updatedDayData[key] = value;

        // Track updated amounts (e.g., Rafi's new amount)
        updatedAmounts[key] = value;
    });

    try {
        // Fetch the previous day's data from Firestore
        const dayDocRef = doc(db, `jobs/${workId}/details`, dayId);
        const daySnapshot = await getDoc(dayDocRef);

        if (daySnapshot.exists()) {
            const previousDayData = daySnapshot.data();

            // Track previous amounts (e.g., Rafi's old amount)
            for (const key in updatedAmounts) {
                previousAmounts[key] = previousDayData[key] || 0; // Default to 0 if the field didn't exist before
            }

            // Update balances for each person whose amount changed
            for (const person in updatedAmounts) {
                const previousAmount = previousAmounts[person] || 0;
                const updatedAmount = updatedAmounts[person];

                if (previousAmount !== updatedAmount) {
                    // Calculate the balance difference
                    const balanceChange = updatedAmount - previousAmount;

                    // Update the balance in the 'salary' collection for the person
                    const salaryDocRef = doc(db, 'salary', person);
                    await updateDoc(salaryDocRef, {
                        balance: increment(balanceChange), // Adjust the balance by the difference
                    });
                }
            }

            // Update the day document in Firestore
            await updateDoc(dayDocRef, updatedDayData);

            closeDayEditPopup(); // Close the popup
            loadDayCards(workId); // Refresh the day cards
        } else {
            alert("Day details not found!");
        }
    } catch (error) {
        console.error("Error updating day details:", error);
        alert("You can't update that field.");
    }
}


// Attach the edit form submission handler
document.addEventListener('DOMContentLoaded', () => {
    const editDayForm = document.getElementById('edit-day-form');
    const closePopupBtn = document.getElementById('close-day-popup');

    if (editDayForm) {
        editDayForm.addEventListener('submit', handleEditDayFormSubmit);
    }

    if (closePopupBtn) {
        closePopupBtn.addEventListener('click', closeDayEditPopup);
    }
});











// Ensure the script only runs on workDetails.html
if (window.location.pathname.includes("workDetails.html")) {
    const workId = new URLSearchParams(window.location.search).get("id"); // Fetch the `workId` from the URL query string
    if (workId) {
        document.addEventListener("DOMContentLoaded", () => loadDayCards(workId)); // Load works when the page loads
    } else {
        console.log("No work ID found in URL.");
    }
} else {
}


// Hide tick and Add day in workcomplete page

// Utility function to get URL parameters
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params.entries());
}

document.addEventListener("DOMContentLoaded", () => {
    const { viewOnly } = getQueryParams();

    if (viewOnly === "true") {
        // Hide the "Complete Work" button
        const completeWorkBtn = document.getElementById("complete-work-btn");
        if (completeWorkBtn) {
            completeWorkBtn.style.display = "none";
        }

        // Hide the "Add Day Details" popup trigger
        const popup = document.getElementById("popup");
        if (popup) {
            popup.style.display = "none";
        }
    }
});


//
// CALCULATIONS
//

document.addEventListener("DOMContentLoaded", () => {
    // Check if the current page is dashboard.html
    if (window.location.pathname.includes("dashboard.html")) {
        calculateExpensesAndDisplayCashPaid();  // Call the function only on dashboard.html
    }
});

async function calculateExpensesAndDisplayCashPaid() {
    const labourChargeElement = document.getElementById("labour-charge");
    const otherExpenseElement = document.getElementById("other-expense");
    const totalCashPaidElement = document.getElementById("total-cash-paid");
    const otherExpensesElement = document.getElementById("othr-expense");
    const netProfitElement = document.getElementById("net-profit");

    // Check if all required elements exist
    if (!labourChargeElement || !otherExpenseElement || !totalCashPaidElement || !otherExpensesElement || !netProfitElement) {
        console.error("One or more required elements are missing from the DOM!");
        return;
    }

    const jobsCollection = collection(db, "jobs");
    const jobsSnapshot = await getDocs(jobsCollection);

    let totalLabourCharge = 0;
    let totalOtherExpenses = 0;
    let totalCashPaid = 0;

    // Fetch total tools cost from Firestore
    const totalToolsCost = await fetchTotalToolsCost();

    for (const jobDoc of jobsSnapshot.docs) {
        const workId = jobDoc.id;
        const jobData = jobDoc.data();

        // Fetch cashPaid field directly from the job document
        if (jobData.cashPaid) {
            totalCashPaid += parseFloat(jobData.cashPaid) || 0;
        }

        // Fetch details subcollection for the current workId
        const detailsCollection = collection(db, `jobs/${workId}/details`);
        const detailsSnapshot = await getDocs(detailsCollection);

        // Calculate labour charges and other expenses
        detailsSnapshot.forEach(detailDoc => {
            const detailData = detailDoc.data();

            // Labour charges
            totalLabourCharge += (parseFloat(detailData.Shahas) || 0);
            totalLabourCharge += (parseFloat(detailData.Rafi) || 0);
            totalLabourCharge += (parseFloat(detailData.Roni) || 0);
            totalLabourCharge += (parseFloat(detailData.Ishaque) || 0);
            totalLabourCharge += (parseFloat(detailData.Midlaj) || 0);

            // Other expenses
            for (const key in detailData) {
                if (!["Shahas", "Rafi", "Roni", "Ishaque", "Midlaj", "dayNumber", "Date"].includes(key)) {
                    const expense = parseFloat(detailData[key]);
                    if (!isNaN(expense)) {
                        totalOtherExpenses += expense;
                    }
                }
            }
        });
    }

    // Use the existing displayed "Other Expenses" amount
    const totalOtherExpensesFromDB = parseFloat(otherExpensesElement.textContent.replace("₹", "").trim()) || 0;

    // Calculate Net Profit including Tool Expenses
    const netProfit = totalCashPaid - (totalLabourCharge + totalOtherExpenses + totalToolsCost + totalOtherExpensesFromDB);

    // Update the UI
    labourChargeElement.textContent = `₹ ${totalLabourCharge.toFixed(2)}`;
    otherExpenseElement.textContent = `₹ ${totalOtherExpenses.toFixed(2)}`;
    totalCashPaidElement.textContent = `₹ ${totalCashPaid.toFixed(2)}`;
    netProfitElement.textContent = `₹ ${netProfit.toFixed(2)}`;

    // Update profit color based on value
    if (netProfit < 0) {
        netProfitElement.style.color = "red";
    } else {
        netProfitElement.style.color = "green";
    }
}

// Renamed function to avoid conflict
async function fetchTotalToolsCost() {
    const toolsCollection = collection(db, "tools");
    const toolsSnapshot = await getDocs(toolsCollection);

    let totalToolsCost = 0;
    toolsSnapshot.forEach(doc => {
        const toolData = doc.data();
        totalToolsCost += toolData.cost || 0; // Assuming each tool has a 'cost' field
    });

    return totalToolsCost;
}




// Completed Work


// Ensure the script only runs on workcompleted.html
if (window.location.pathname.includes("workcompleted.html")) {
    // Function to calculate subtotal for a work
    async function calculateWorkSubtotal(workId) {
        let subtotal = 0;

        try {
            const detailsCollectionRef = collection(db, `jobs/${workId}/details`);
            const detailsSnapshot = await getDocs(detailsCollectionRef);

            detailsSnapshot.forEach((docSnap) => {
                const dayData = docSnap.data();

                // Sum all numeric fields in each document
                Object.entries(dayData).forEach(([key, value]) => {
                    if (typeof value === "number" && key !== "dayNumber") {
                        subtotal += value;
                    }
                });
            });
        } catch (error) {
            console.error(`Error calculating subtotal for work ${workId}:`, error);
        }

        return subtotal;
    }



    async function calculateTotalProfit() {
        let totalProfit = 0;
        try {
            const worksCollection = collection(db, "jobs");
            const completedWorksQuery = query(worksCollection, where("status", "==", "completed"));
            const querySnapshot = await getDocs(completedWorksQuery);
    
            for (const docSnapshot of querySnapshot.docs) {
                const work = docSnapshot.data();
                const workId = docSnapshot.id;
    
                let totalExpense = await calculateWorkSubtotal(workId); // Fetch expenses
                let cashPaid = work.cashPaid || 0;
                let profit = cashPaid - totalExpense; // Calculate profit for this work
    
                totalProfit += profit; // Accumulate total profit
            }
    
            // Update the Profit display in the header
            const profitDisplay = document.querySelector("header h4");
            if (profitDisplay) {
                profitDisplay.innerHTML = `Profit: <span style="color: ${totalProfit >= 0 ? 'lightgreen' : 'red'};">₹ ${totalProfit.toFixed(2)}</span>`;
            }
    
        } catch (error) {
            console.error("Error calculating total profit:", error);
        }
    }
    


    // Function to fetch and display works with status = "completed"
    async function fetchAndDisplayCompletedWorks() {
        try {
            const worksCollection = collection(db, "jobs");
            const completedWorksQuery = query(worksCollection, where("status", "==", "completed"), orderBy("workNum", "desc"));
            const querySnapshot = await getDocs(completedWorksQuery);
            const mainDashboard = document.querySelector("main.dashboard");

            // Clear any existing content
            mainDashboard.innerHTML = "";

            for (const docSnapshot of querySnapshot.docs) {
                const work = docSnapshot.data();
                const workId = docSnapshot.id;

                // Dynamically calculate subtotal for this work (await since it's an async function)
                let totalAmount = await calculateWorkSubtotal(workId);
                let cashPaid = work.cashPaid || 0;
                let profit = cashPaid - totalAmount; // Profit Calculation

                const workCard = document.createElement("section");
                workCard.classList.add("card");

                workCard.innerHTML = `
                    <h2>Work ${work.workNum} - ${work.workName} ${work.place || "N/A"}</h2>
                    <p>Details: ${work.details || "No details available"}</p>
                    <p>Date: ${work.date ? new Date(work.date).toLocaleDateString("en-GB") : "N/A"}</p>
                    <p>Estimate: ₹${work.estimate || "0.00"}</p>
                    <p>Cash Paid: ₹${work.cashPaid || "0.00"}</p>
                    <p>Total Amount: ₹<span class="total-amount">Calculating...</span></p>
                    <p>Profit: <strong class="profit-amount" style="color: ${profit >= 0 ? 'green' : 'red'};">₹ ${profit.toFixed(2)}</strong></p>


                    <div class="card-actions">
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </div>
                `;

                // Append card before fetching subtotal
                mainDashboard.appendChild(workCard);

                // Fetch and update subtotal dynamically
                const subtotal = await calculateWorkSubtotal(workId);
                workCard.querySelector(".total-amount").textContent = subtotal.toFixed(2);

                // Edit button functionality
                workCard.querySelector(".edit-btn").addEventListener("click", (event) => {
                    event.stopPropagation();
                    openEditPopup(workId, work);
                });

                // Delete button functionality
                workCard.querySelector(".delete-btn").addEventListener("click", async (event) => {
                    event.stopPropagation();
                    const confirmed = window.confirm("Are you sure you want to delete this work?");
                    if (confirmed) {
                        try {
                            const workDocRef = doc(db, "jobs", workId);
                            const detailsCollectionRef = collection(db, `jobs/${workId}/details`);

                            const detailsSnapshot = await getDocs(detailsCollectionRef);
                            const deletePromises = detailsSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
                            await Promise.all(deletePromises);

                            await deleteDoc(workDocRef);
                            workCard.remove();
                            console.log("Work deleted from Firestore and DOM.");
                        } catch (error) {
                            console.error("Error deleting work:", error);
                            alert("Failed to delete the work. Please try again.");
                        }
                    }
                });

                // Click event to redirect to work details page
                workCard.addEventListener("click", () => {
                    window.location.href = `workDetails.html?id=${workId}&viewOnly=true`;
                });
            }

            if (querySnapshot.empty) {
                mainDashboard.innerHTML = `<p>No completed works found.</p>`;
            }

            await calculateTotalProfit();

        } catch (error) {
            console.error("Error fetching completed works: ", error);
            mainDashboard.innerHTML = `<p>Failed to load works. Please try again later.</p>`;
        }
    }

    // Function to open the edit popup
    function openEditPopup(workId, workData) {
        const popup = document.getElementById("editpopup");
        const editForm = document.getElementById("edit-form");

        if (!popup || !editForm) {
            console.error("Popup or form not found in the DOM.");
            return;
        }

        document.getElementById("edit-work-num").value = workData.workNum || "";
        document.getElementById("edit-work-name").value = workData.workName || "";
        document.getElementById("edit-place").value = workData.place || "";
        document.getElementById("edit-date").value = workData.date || "";
        document.getElementById("edit-estimate").value = workData.estimate || "";
        document.getElementById("edit-cashpaid").value = workData.cashPaid || "";
        document.getElementById("edit-details").value = workData.details || "";

        editForm.setAttribute("data-edit-id", workId);
        popup.style.display = "block";
    }

    function closeEditPopup() {
        document.getElementById("editpopup").style.display = "none";
        document.getElementById("edit-form").removeAttribute("data-edit-id");
    }

    async function updateWorkInFirestore(workId, workData) {
        try {
            const workDocRef = doc(db, "jobs", workId);
            await updateDoc(workDocRef, workData);
            alert("Work updated successfully!");
            fetchAndDisplayCompletedWorks();
        } catch (error) {
            console.error("Error updating work:", error);
            alert("Failed to update work. Please try again.");
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        const editForm = document.getElementById("edit-form");
        document.getElementById("close-popup").addEventListener("click", closeEditPopup);

        if (editForm) {
            editForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                const workId = editForm.getAttribute("data-edit-id");
                const updatedWorkData = {
                    workNum: parseInt(document.getElementById("edit-work-num").value) || 0, // Ensure it's stored as a number
                    workName: document.getElementById("edit-work-name").value.trim(),
                    place: document.getElementById("edit-place").value.trim(),
                    date: document.getElementById("edit-date").value.trim(),
                    estimate: parseFloat(document.getElementById("edit-estimate").value) || 0, // Ensure it's stored as a number
                    cashPaid: parseFloat(document.getElementById("edit-cashpaid").value) || 0,
                    details: document.getElementById("edit-details").value.trim()
                };

                if (workId) {
                    await updateWorkInFirestore(workId, updatedWorkData);
                }

                closeEditPopup();
            });
        }

        fetchAndDisplayCompletedWorks();
    });


    //Search Function

    document.addEventListener("DOMContentLoaded", () => {
        // Add event listener to the search button
        document.getElementById("search-btn").addEventListener("click", searchWorks);
    });
    
    // Function to filter and display search results
    function searchWorks() {
        const searchQuery = document.getElementById("search-input").value.toLowerCase();
        const workCards = document.querySelectorAll(".card");
        let found = false;
    
        workCards.forEach(card => {
            const workName = card.querySelector("h2").textContent.toLowerCase();
            const details = card.querySelectorAll("p");
            const date = details[1].textContent.toLowerCase(); // Assuming Date is the second <p>
            const place = workName; // Place might be inside the <h2> itself
    
            if (workName.includes(searchQuery) || date.includes(searchQuery) || place.includes(searchQuery)) {
                card.style.display = "block"; // Show matching work
                if (!found) {
                    card.scrollIntoView({ behavior: "smooth", block: "start" }); // Scroll to first match
                    found = true;
                }
            } else {
                card.style.display = "none"; // Hide non-matching work
            }
        });
    
        if (!found) {
            alert("No matching work found!");
        }
    }
    
    



}





// Pending to Complete


document.addEventListener("DOMContentLoaded", () => {
    // Check if the current page is workDetails.html
    if (!window.location.pathname.includes("workDetails.html")) return;

    const cashPopup = document.getElementById("cash-popup");
    const completeWorkBtn = document.getElementById("complete-work-btn");
    const cashForm = document.getElementById("cash-form");
    const closeCashPopup = document.getElementById("close-cash-popup");
    const workId = getWorkIdFromURL(); // Replace this with your actual method for retrieving work ID
    
    // Show the cash popup when the floating button is clicked
    completeWorkBtn.addEventListener("click", () => {
        if (!workId) {
            alert("Invalid work ID. Cannot complete work.");
            return;
        }
        cashPopup.style.display = "block";
    });

    // Close the cash popup when cancel is clicked
    closeCashPopup.addEventListener("click", () => {
        cashPopup.style.display = "none";
    });

    // Handle cash form submission
    cashForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const cashPaid = parseFloat(document.getElementById("cashPaid").value);

        if (isNaN(cashPaid) || cashPaid <= 0) {
            alert("Please enter a valid cash amount.");
            return;
        }

        // Update Firestore with cashPaid and status
        try {
            const workDocRef = doc(db, "jobs", workId);
            await updateDoc(workDocRef, {
                cashPaid: cashPaid,
                status: "completed"
            });

            alert("Work marked as completed and cash paid recorded.");
            cashPopup.style.display = "none";
        } catch (error) {
            console.error("Error updating work status:", error);
            alert("Failed to update work status. Please try again.");
        }
    });
});



// Completed or Pending Count


// Function to fetch and display the status of all work
async function updateWorkStatusCounts() {
    const workCompletedElement = document.getElementById("work-completed");
    const workPendingElement = document.getElementById("work-pending");

    // Check if the required elements exist
    if (!workCompletedElement || !workPendingElement) {
        console.error("One or more required elements are missing from the DOM!");
        return;
    }

    const jobsCollection = collection(db, "jobs");
    const jobsSnapshot = await getDocs(jobsCollection);

    let completedCount = 0;
    let pendingCount = 0;

    jobsSnapshot.forEach((jobDoc) => {
        const jobData = jobDoc.data();
        
        // Check the status of each job
        if (jobData.status === "completed") {
            completedCount++;
        } else if (jobData.status === "pending") {
            pendingCount++;
        }
    });

    // Update the UI
    workCompletedElement.textContent = completedCount;
    workPendingElement.textContent = pendingCount;
}

// Call the function after the page loads
document.addEventListener("DOMContentLoaded", () => {
    // Check if the current page is dashboard.html
    if (window.location.pathname.includes("dashboard.html")) {
        updateWorkStatusCounts();  // Call the function only on dashboard.html
    }
});


// Tool


// Navigate to tools.html when the expenses card is clicked
document.addEventListener("DOMContentLoaded", () => {
    const expensesCard = document.getElementById("expenses");

    if (expensesCard) {
        expensesCard.addEventListener("click", () => {
            window.location.href = "tools.html";
        });
    }
});

// Form and container references
const toolListContainer = document.getElementById("tool-list-container");

document.addEventListener("DOMContentLoaded", () => {
    const toolAddForm = document.getElementById("tool-add-form");

    // Ensure this script runs only if the form exists (i.e., on tools.html)
    if (toolAddForm) {
        // Add a new tool
        toolAddForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const toolName = document.getElementById("tool-name").value.trim();
            const toolType = document.getElementById("tool-type").value;
            const purchaseDate = document.getElementById("purchase-date").value;
            const cost = document.getElementById("cost").value.trim();
            const description = document.getElementById("description").value.trim();

            // Basic validation
            if (!toolName || !toolType || !cost || isNaN(cost)) {
                alert("Please fill the fields correctly.");
                return;
            }

            try {
                // Add tool to Firestore
                await addDoc(collection(db, "tools"), {
                    name: toolName,
                    type: toolType,
                    purchaseDate,
                    cost: parseFloat(cost),
                    description,
                });

                toolAddForm.reset(); // Reset the form
                fetchAndDisplayTools(); // Refresh the tools list
                alert("Tool added successfully!");
            } catch (error) {
                console.error("Error adding tool: ", error);
                alert("Failed to add tool. Please try again.");
            }
        });
    }
});


// Fetch and display tools
async function fetchAndDisplayTools() {
    toolListContainer.innerHTML = "<p>Loading tools...</p>"; // Show loading indicator

    try {
        const toolsSnapshot = await getDocs(collection(db, "tools"));
        toolListContainer.innerHTML = ""; // Clear the list

        if (toolsSnapshot.empty) {
            toolListContainer.innerHTML = "<p>No tools found. Add your first tool!</p>";
            return;
        }

        const toolsArray = [];

        toolsSnapshot.forEach((docSnapshot) => {
            const tool = docSnapshot.data();
            toolsArray.push({ ...tool, id: docSnapshot.id });
        });

        // Sort tools by purchaseDate (latest first)
        toolsArray.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));

        toolsArray.forEach((tool) => {
            // Create tool card
            const toolItem = document.createElement("div");
            toolItem.classList.add("tool-item");

            toolItem.innerHTML = `
            <div>
                <h3>${tool.name}</h3>
                <p>Type: ${tool.type}</p>
                <p>Purchased: ${tool.purchaseDate ? new Date(tool.purchaseDate).toLocaleDateString("en-GB") : "N/A"}</p>
                <p>Description: ${tool.description}</p>
            </div>
            <div>
                <p>₹${tool.cost.toFixed(2)}</p>
                <button class="delete-btn" data-id="${tool.id}">Delete</button>
            </div>
            `;

            // Attach delete functionality
            toolItem.querySelector(".delete-btn").addEventListener("click", () => deleteTool(tool.id));
            toolListContainer.appendChild(toolItem);
        });
    } catch (error) {
        console.error("Error fetching tools: ", error);
        toolListContainer.innerHTML = "<p>Failed to load tools. Please try again later.</p>";
    }
}


// Delete a tool
async function deleteTool(toolId) {
    if (!confirm("Are you sure you want to delete this tool?")) return;

    try {
        await deleteDoc(doc(db, "tools", toolId));

        // Provide temporary visual feedback for deletion
        const toolItem = document.querySelector(`button[data-id="${toolId}"]`).parentElement;
        if (toolItem) {
            toolItem.style.opacity = "0.5";
            toolItem.style.transition = "opacity 0.3s";

            setTimeout(() => {
                fetchAndDisplayTools(); // Refresh the tools list after a slight delay
            }, 300);
        }

        alert("Tool deleted successfully!");
    } catch (error) {
        console.error("Error deleting tool: ", error);
        alert("Failed to delete tool. Please try again.");
    }
}

// Initial fetch on page load
document.addEventListener("DOMContentLoaded", () => {
    // Ensure this script runs only on tools.html
    if (window.location.pathname.includes("tools.html")) {
        fetchAndDisplayTools();
    }
});



// Tool Expence Calculation

document.addEventListener("DOMContentLoaded", () => {
    // Check if the current page is dashboard.html
    if (window.location.pathname.includes("dashboard.html")) {
        calculateToolExpenses();  // Call the function only on dashboard.html
    }
});

async function calculateToolExpenses() {
    const newToolsElement = document.getElementById("new-tools");
    const serviceToolsElement = document.getElementById("service-tools");
    const totalToolsElement = document.getElementById("total-tools");

    // Check if required elements exist
    if (!newToolsElement || !serviceToolsElement || !totalToolsElement) {
        console.error("One or more required elements are missing from the DOM!");
        return;
    }

    try {
        const toolsSnapshot = await getDocs(collection(db, "tools"));

        let totalNewToolsCost = 0;
        let totalServiceToolsCost = 0;

        toolsSnapshot.forEach((doc) => {
            const tool = doc.data();

            // Ensure valid data and add cost to respective category
            if (tool.cost && tool.type) {
                const cost = parseFloat(tool.cost) || 0;

                if (tool.type === "new") {
                    totalNewToolsCost += cost;
                } else if (tool.type === "service") {
                    totalServiceToolsCost += cost;
                }
            }
        });

        // Calculate total cost
        const totalToolsCost = totalNewToolsCost + totalServiceToolsCost;

        // Update UI
        newToolsElement.textContent = `₹ ${totalNewToolsCost.toFixed(2)}`;
        serviceToolsElement.textContent = `₹ ${totalServiceToolsCost.toFixed(2)}`;
        totalToolsElement.textContent = `₹ ${totalToolsCost.toFixed(2)}`;
    } catch (error) {
        console.error("Error fetching tools: ", error);
        alert("Failed to calculate tool expenses. Please try again.");
    }
}


document.addEventListener("DOMContentLoaded", async () => {
    // Check if the current page is dashboard.html
    if (!window.location.pathname.includes("dashboard.html")) return;

    const toolExpenseElement = document.getElementById("tool-expense");

    // Fetch the total tools cost from Firestore or calculate it (if it's already available)
    const totalToolsCost = await getTotalToolsCost(); // Function that calculates the total tools cost

    if (toolExpenseElement) {
        // Set the value to the "Tool Expenses" field in the dashboard
        toolExpenseElement.textContent = `₹ ${totalToolsCost.toFixed(2)}`;
    }
});

// Function to calculate total tools cost (this depends on how you're fetching or calculating the total)
async function getTotalToolsCost() {
    // Fetch data from Firestore or calculate the total here (this is just an example)
    const toolsCollection = collection(db, "tools");
    const toolsSnapshot = await getDocs(toolsCollection);

    let totalToolsCost = 0;
    toolsSnapshot.forEach(doc => {
        const toolData = doc.data();
        totalToolsCost += toolData.cost || 0; // Assuming each tool has a 'cost' field
    });

    return totalToolsCost;
}




// Other Expenses


document.addEventListener("DOMContentLoaded", async () => {
    // ✅ Run this script only if we are on otherexpenses.html
    if (!window.location.pathname.endsWith("otherexpenses.html")) {
        return;
    }

    const expenseFormContainer = document.getElementById("other-expense-form-container");
    const expenseForm = document.getElementById("other-expense-form");
    const addExpenseBtn = document.getElementById("show-expense-form-btn");
    const expenseTableBody = document.getElementById("other-expense-table-body");

    // Hide form initially
    expenseFormContainer.style.display = "none";

    // Toggle form visibility when button is clicked
    addExpenseBtn.addEventListener("click", () => {
        if (expenseFormContainer.style.display === "none") {
            expenseFormContainer.style.display = "block";
            addExpenseBtn.textContent = "Hide Expense Form";
        } else {
            expenseFormContainer.style.display = "none";
            addExpenseBtn.textContent = "Add New Expense";
        }
    });

    // Fetch and display expenses from Firestore
    async function fetchAndDisplayExpenses() {
        expenseTableBody.innerHTML = "<tr><td colspan='7'>Loading expenses...</td></tr>";

        try {
            const expensesSnapshot = await getDocs(collection(db, "expenses"));
            expenseTableBody.innerHTML = ""; // Clear table

            if (expensesSnapshot.empty) {
                expenseTableBody.innerHTML = "<tr><td colspan='7'>No expenses found.</td></tr>";
                return;
            }

            let expenses = [];

            // Loop through expenses and store in an array for sorting
            expensesSnapshot.forEach(docSnapshot => {
                const expense = docSnapshot.data();
                let formattedDate = "N/A";

                if (expense.date) {
                    const dateObj = new Date(expense.date);
                    const day = dateObj.getDate().toString().padStart(2, "0");
                    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
                    const year = dateObj.getFullYear();
                    formattedDate = `${day}/${month}/${year}`;
                }

                expenses.push({
                    id: docSnapshot.id,
                    materialName: expense.materialName,
                    materialAmount: expense.materialAmount,
                    cargoFees: expense.cargoFees,
                    transport: expense.transport,
                    date: expense.date || "N/A",
                    formattedDate, // Store formatted date for display
                    total: (expense.materialAmount + expense.cargoFees + expense.transport).toFixed(2)
                });
            });

            // **Sort by date (Latest first)**
            expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Render the expenses
            expenses.forEach(expense => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${expense.formattedDate}</td> <!-- Show formatted date -->
                    <td>${expense.materialName}</td>
                    <td>₹${expense.materialAmount.toFixed(2)}</td>
                    <td>₹${expense.cargoFees.toFixed(2)}</td>
                    <td>₹${expense.transport.toFixed(2)}</td>
                    <td><strong>₹${expense.total}</strong></td>
                    <td><button class="expense-delete-btn" data-id="${expense.id}">Delete</button></td>
                `;

                // Attach delete event
                row.querySelector(".expense-delete-btn").addEventListener("click", async () => {
                    await deleteDoc(doc(db, "expenses", expense.id));
                    fetchAndDisplayExpenses();
                });

                expenseTableBody.appendChild(row);
            });

        } catch (error) {
            console.error("Error fetching expenses:", error);
        }
    }

    // Add new expense to Firestore
    expenseForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const rawDate = document.getElementById("expense-date").value;
        const formattedDate = new Date(rawDate).toISOString().split("T")[0]; // Store in YYYY-MM-DD

        const newExpense = {
            date: formattedDate, // ✅ Store in Firestore as YYYY-MM-DD
            materialName: document.getElementById("expense-material").value.trim(),
            materialAmount: parseFloat(document.getElementById("expense-material-amount").value),
            cargoFees: parseFloat(document.getElementById("expense-cargo-fees").value),
            transport: parseFloat(document.getElementById("expense-transport").value)
        };

        await addDoc(collection(db, "expenses"), newExpense);
        expenseForm.reset();
        fetchAndDisplayExpenses();
    });

    // Load expenses on page load
    fetchAndDisplayExpenses();
});


document.addEventListener("DOMContentLoaded", async () => {
    // ✅ Run this script only if we are on the dashboard
    if (!window.location.pathname.endsWith("dashboard.html")) {
        return;
    }

    document.getElementById("other-expenses").addEventListener("click", () => {
        window.location.href = "otherexpenses.html"; // Redirect to the page
    });

    const totalExpensesElement = document.getElementById("total-expenses");

    // Fetch and calculate total other expenses
    async function fetchTotalExpenses() {
        try {
            const expensesSnapshot = await getDocs(collection(db, "expenses"));
            let totalAmount = 0;

            expensesSnapshot.forEach(docSnapshot => {
                const expense = docSnapshot.data();
                totalAmount += (expense.materialAmount || 0) + (expense.cargoFees || 0) + (expense.transport || 0);
            });

            // ✅ Update the UI with the total amount
            totalExpensesElement.textContent = `₹ ${totalAmount.toFixed(2)}`;
        } catch (error) {
            console.error("Error fetching total expenses:", error);
        }
    }

    // Load total expenses when the dashboard loads
    fetchTotalExpenses();

    // ✅ Select elements in the Dashboard
    const overviewOtherExpensesElement = document.getElementById("othr-expense"); // Overview

    // ✅ Function to fetch and update total other expenses
    async function fetchTotalExpenses() {
        try {
            const expensesSnapshot = await getDocs(collection(db, "expenses"));
            let totalAmount = 0;

            expensesSnapshot.forEach(docSnapshot => {
                const expense = docSnapshot.data();
                totalAmount += (expense.materialAmount || 0) + (expense.cargoFees || 0) + (expense.transport || 0);
            });

            // ✅ Update UI (Both Card and Overview)
            if (totalExpensesElement) totalExpensesElement.textContent = `₹ ${totalAmount.toFixed(2)}`;
            if (overviewOtherExpensesElement) overviewOtherExpensesElement.textContent = `₹ ${totalAmount.toFixed(2)}`;
        } catch (error) {
            console.error("Error fetching total expenses:", error);
        }
    }

    // ✅ Fetch and display total expenses
    fetchTotalExpenses();

    // ✅ Listen for real-time changes in Firestore and update the UI dynamically
    onSnapshot(collection(db, "expenses"), (snapshot) => {
        let totalAmount = 0;

        snapshot.forEach(doc => {
            const expense = doc.data();
            totalAmount += (expense.materialAmount || 0) + (expense.cargoFees || 0) + (expense.transport || 0);
        });

        // ✅ Update UI (Both Card and Overview)
        if (totalExpensesElement) totalExpensesElement.textContent = `₹ ${totalAmount.toFixed(2)}`;
        if (overviewOtherExpensesElement) overviewOtherExpensesElement.textContent = `₹ ${totalAmount.toFixed(2)}`;
    });

});












//Salary

document.addEventListener("DOMContentLoaded", async () => {

    // Ensure this script runs only on salary.html
    if (!window.location.pathname.endsWith("salary.html")) {
        return;
    }


    const tableBody = document.getElementById("salary-table-body");
    if (!tableBody) {
        console.error("Salary table body element not found! Check the HTML for the correct ID.");
        return;
    }

    const salaryCollection = collection(db, "salary");

    // Fetch and display salary details
    await fetchAndDisplaySalaries();

    async function fetchAndDisplaySalaries() {
        tableBody.innerHTML = "";
        const salarySnapshot = await getDocs(salaryCollection);
    
        salarySnapshot.forEach((doc) => {
            const name = doc.id;
            const data = doc.data();
            const balance = data.balance || 0;
    
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${name}</td>
                <td><span class="salary-value" data-name="${name}" style="cursor: pointer; color: blue; text-decoration: underline;">Click to Load</span></td>
                <td>₹ ${Math.round(balance)}</td>
                <td>
                    <button class="pay-btn" data-name="${name}" data-balance="${balance}">Pay</button>
                    <button class="details-btn" onclick="window.location.href='employeeDetails.html?name=${encodeURIComponent(name)}'">Details</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    
        // Add event listener to the salary span for loading salary on click
        document.querySelectorAll(".salary-value").forEach(span => {
            span.addEventListener("click", async (event) => {
                const name = event.target.getAttribute("data-name");

                event.target.textContent = "Loading..."; // Show loading state
                const totalSalary = await calculateTotalSalary(name);
                event.target.textContent = `₹ ${totalSalary.toFixed(2)}`; // Update with calculated salary
            });
        });
    
        document.querySelectorAll(".pay-btn").forEach(button => {
            button.addEventListener("click", handlePayButton);
        });
    }
    



    document.addEventListener("click", async (event) => {
        if (event.target.classList.contains("show-salary-btn")) {
            const name = event.target.getAttribute("data-name");
            const salaryCell = document.getElementById(`salary-${name}`);
    
            if (!name || !salaryCell) return;
    
            // Fetch and calculate the salary
            salaryCell.innerText = "Loading..."; // Show loading indicator
            const totalSalary = await calculateTotalSalary(name);
            salaryCell.innerText = `₹ ${totalSalary.toFixed(2)}`;
        }
    });




    // Function: Handle Pay button click
    async function handlePayButton(event) {
        const name = event.target.getAttribute("data-name");
        const currentBalance = parseFloat(event.target.getAttribute("data-balance"));

        if (!name || isNaN(currentBalance)) {
            alert("Invalid employee or balance data.");
            return;
        }

        const payAmount = parseFloat(prompt(`Enter amount to pay for ${name} (Current balance: ₹${currentBalance}):`));
        if (isNaN(payAmount) || payAmount <= 0) {
            alert("Please enter a valid payment amount.");
            return;
        }

        // ✅ Remove balance limit check (Allow negative balance)
        const newBalance = currentBalance - payAmount;

        try {
            const salaryDocRef = doc(db, "salary", name);
            await updateDoc(salaryDocRef, {
                balance: newBalance // ✅ Now balance can be negative
            });

            alert(`Successfully paid ₹${payAmount} to ${name}. Updated balance: ₹${newBalance.toFixed(2)}`);

            // Store the transaction details in a new collection for transaction history
            const transactionCollection = collection(db, "transactionHistory");
            await addDoc(transactionCollection, {
                name: name,
                payAmount: payAmount,
                transactionDate: new Date()  // Storing the current timestamp
            });

            // Refresh table data after payment
            await fetchAndDisplaySalaries();

        } catch (error) {
            console.error("Error updating balance:", error);
            alert("Failed to update balance. Please try again.");
        }
    }


    async function calculateTotalSalary(name) {
        const jobsCollection = collection(db, "jobs");
        const jobsSnapshot = await getDocs(jobsCollection);

        let totalSalary = 0;

        for (const jobDoc of jobsSnapshot.docs) {
            const workId = jobDoc.id;
            const detailsCollection = collection(db, `jobs/${workId}/details`);
            const detailsSnapshot = await getDocs(detailsCollection);

            detailsSnapshot.forEach(detailDoc => {
                const detailData = detailDoc.data();
                if (detailData[name]) {
                    totalSalary += parseFloat(detailData[name]) || 0;
                }
            });
        }

        return totalSalary;
    }
});


// Payment History

document.addEventListener("DOMContentLoaded", async () => {
    // Ensure this script runs only on transactionHistory.html
    if (!window.location.pathname.endsWith("transactionHistory.html")) {
      return;
    }
  
    const historyTable = document.getElementById("transaction-history-table");
    if (!historyTable) {
      console.error("Transaction history table element not found! Check the HTML for the correct ID.");
      return;
    }
  
    // Function to fetch and display transaction history (sorted by most recent first)
    async function fetchAndDisplayTransactionHistory() {
        // Clear any existing table content
        historyTable.innerHTML = "";
    
        // Create the header row
        const headerRow = document.createElement("tr");
        headerRow.innerHTML = `
        <th>Employee Name</th>
        <th>Payment Amount (₹)</th>
        <th>Transaction Date</th>
        `;
        historyTable.appendChild(headerRow);
    
        // Reference the transactionHistory collection
        const transactionCollection = collection(db, "transactionHistory");
        const transactionSnapshot = await getDocs(transactionCollection);
    
        // Collect transactions into an array with a timestamp value
        const transactions = [];
        transactionSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        let timestamp = 0;
        if (data.transactionDate && data.transactionDate.seconds) {
            timestamp = data.transactionDate.seconds;
        } else if (data.transactionDate) {
            timestamp = new Date(data.transactionDate).getTime() / 1000;
        }
        transactions.push({ data, timestamp });
        });
    
        // Sort transactions by timestamp descending (most recent first)
        transactions.sort((a, b) => b.timestamp - a.timestamp);
    
        // Append each transaction row in sorted order
        transactions.forEach(({ data }) => {
        let dateString = "N/A";
        if (data.transactionDate && data.transactionDate.seconds) {
            const dateObj = new Date(data.transactionDate.seconds * 1000);
            dateString = dateObj.toLocaleString();
        } else if (data.transactionDate) {
            dateString = new Date(data.transactionDate).toLocaleString();
        }
    
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${data.name}</td>
            <td>₹ ${parseFloat(data.payAmount).toFixed(2)}</td>
            <td>${dateString}</td>
        `;
        historyTable.appendChild(row);
        });
    }
  
    // Fetch and display transaction history when the page loads
    await fetchAndDisplayTransactionHistory();
});
  

// Employee Details

document.addEventListener("DOMContentLoaded", async () => {
    // ✅ Run this script only if we are on employeeDetails.html
    if (!window.location.pathname.endsWith("employeeDetails.html")) {
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const employeeName = urlParams.get("name");

    if (!employeeName) {
        alert("Employee name not found.");
        return;
    }

    document.getElementById("employee-name").textContent = employeeName;

    try {
        const jobsCollection = collection(db, "jobs");
        const jobsQuery = query(jobsCollection, orderBy("date", "desc"));
        const jobSnapshot = await getDocs(jobsQuery);

        let lastEntries = [];


        // Loop through jobs and check inside `details` subcollection
        for (const jobDoc of jobSnapshot.docs) {
            const jobData = jobDoc.data();
            const jobId = jobDoc.id;


            // Reference the details subcollection for this job
            const detailsCollectionRef = collection(db, `jobs/${jobId}/details`);
            const detailsSnapshot = await getDocs(detailsCollectionRef);

            for (const dayDoc of detailsSnapshot.docs) {
                const dayData = dayDoc.data();
                
                const salary = dayData[employeeName] || 0; // ✅ Get salary or default to 0
                if (salary > 0) { // ✅ Ignore if salary is 0
                    let formattedDate = "N/A";
                    if (dayData.Date) {
                        const dateObj = new Date(dayData.Date);
                        formattedDate = dateObj.toLocaleDateString("en-GB"); // ✅ Converts to DD/MM/YYYY
                    }

                    lastEntries.push({
                        location: jobData.place || "N/A",
                        date: formattedDate, // ✅ Display proper formatted date
                        salary: salary
                    });

                    // Stop after collecting 30 valid job entries (days)
                    if (lastEntries.length === 30) break;
                }
            }

            if (lastEntries.length === 30) break; // Stop fetching after 30 valid entries
        }

        // **Sort the list to make the latest work appear at the top**
        lastEntries.sort((a, b) => {
            return new Date(b.date.split("/").reverse().join("-")) - new Date(a.date.split("/").reverse().join("-"));
        });

        // Select the table body element
        const tableBody = document.getElementById("job-history-body");
        tableBody.innerHTML = ""; // Clear previous content

        if (lastEntries.length === 0) {
            console.log("No recent jobs found for", employeeName);
            tableBody.innerHTML = `<tr><td colspan="3">No recent jobs found.</td></tr>`;
        } else {
            lastEntries.forEach(entry => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${entry.date}</td>
                    <td>${entry.location}</td>
                    <td>₹${entry.salary}</td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Error fetching employee details:", error);
        alert("Failed to load employee details.");
    }
});



//Search Work Details

document.addEventListener("DOMContentLoaded", function () {
    // Check if the current page is employeeDetails.html
    if (window.location.pathname.includes("employeeDetails.html")) {
        document.getElementById("searchButton").addEventListener("click", function () {
            const searchValue = document.getElementById("searchInput").value.trim();

            if (searchValue !== "") {
                // Encode to ensure special characters (like spaces) are URL-safe
                const encodedName = encodeURIComponent(searchValue);
                window.location.href = `employeeDetails.html?name=${encodedName}`;
            } else {
                alert("Please enter an employee name!");
            }
        });
    }
});








document.addEventListener("DOMContentLoaded", () => {
    // ✅ Run only in dashboard.html
    if (!window.location.pathname.endsWith("dashboard.html")) return;

    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");
    const resultsSection = document.getElementById("search-results");
    const resultsList = document.getElementById("results-list");

    searchBtn.addEventListener("click", async () => {
        const queryText = searchInput.value.trim().toLowerCase();
        if (queryText === "") return;

        resultsList.innerHTML = "<p>Searching...</p>";
        resultsSection.style.display = "block";

        try {
            // Fetch results from all three collections
            const [jobsResults, toolsResults, expensesResults] = await Promise.all([
                searchJobs(queryText),
                searchTools(queryText),
                searchExpenses(queryText)
            ]);

            // Combine all results
            const allResults = [...jobsResults, ...toolsResults, ...expensesResults];

            resultsList.innerHTML = ""; // Clear old results
            if (allResults.length === 0) {
                resultsList.innerHTML = "<p>No matching results found.</p>";
            } else {
                allResults.forEach(result => {
                    const listItem = document.createElement("li");
                    listItem.innerHTML = `<strong>${result.title}</strong>: ${result.details}`;
                    resultsList.appendChild(listItem);
                });
            }
        } catch (error) {
            console.error("Error searching:", error);
            resultsList.innerHTML = "<p>Error fetching search results.</p>";
        }
    });

    // ✅ Function to format dates as DD/MM/YYYY
    function formatDate(isoDate) {
        if (!isoDate) return "N/A";
        const dateObj = new Date(isoDate);
        if (isNaN(dateObj.getTime())) return "N/A"; // Handle invalid dates
        return dateObj.toLocaleDateString("en-GB"); // Converts to DD/MM/YYYY
    }

    async function searchJobs(queryText) {
        const jobsCollection = collection(db, "jobs");
        const snapshot = await getDocs(jobsCollection);
        let results = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const lowerQuery = queryText.toLowerCase();
            const formattedDate = formatDate(data.date);

            if (
                (formattedDate.toLowerCase().includes(lowerQuery)) || 
                (data.workName && data.workName.toLowerCase().includes(lowerQuery)) || 
                (data.workNum && data.workNum.toString().includes(lowerQuery)) || 
                (data.cashPaid && data.cashPaid.toString().includes(lowerQuery)) || 
                (data.place && data.place.toLowerCase().includes(lowerQuery))
            ) {
                results.push({
                    title: `W${data.workNum}, ${data.workName}`,
                    details: `${data.place}, Date: ${formattedDate}`
                });
            }
        });

        return results;
    }

    async function searchTools(queryText) {
        const toolsCollection = collection(db, "tools");
        const snapshot = await getDocs(toolsCollection);
        let results = [];
    
        snapshot.forEach(doc => {
            const data = doc.data();
            const lowerQuery = queryText.toLowerCase();
            const formattedDate = formatDate(data.purchaseDate);
    
            if (
                (data.name && data.name.toLowerCase().includes(lowerQuery)) || 
                (formattedDate.toLowerCase().includes(lowerQuery)) ||
                (data.cost && data.cost.toString().includes(lowerQuery))
            ) {
                results.push({
                    title: `🛠️ ${data.name}`,
                    details: `Date: ${formattedDate}, Cost: ₹${data.cost || "N/A"}`
                });
            }
        });
    
        return results;
    }
    

    async function searchExpenses(queryText) {
        const expensesCollection = collection(db, "expenses");
        const snapshot = await getDocs(expensesCollection);
        let results = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const formattedDate = formatDate(data.date);

            if (
                (data.materialName && data.materialName.toLowerCase().includes(queryText)) || 
                (formattedDate.toLowerCase().includes(queryText))
            ) {
                results.push({
                    title: `${data.materialName || "Unknown"}`,
                    details: `Date: ${formattedDate}, Amount: ₹${data.materialAmount || 0}`
                });
            }
        });

        return results;
    }
});
