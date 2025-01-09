document.addEventListener("DOMContentLoaded", function () {
    // State management for admin login
    let isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
    const loginForm = document.getElementById("admin-login-form");
    const loginError = document.getElementById("login-error");
    const adminManagementSection = document.getElementById("admin-management");
    const logoutSection = document.getElementById("logout-section"); // New logout section for dynamic display

    // Add event listener for adding a current exhibition
    const addCurrentExhibitionButton = document.getElementById("add-current-exhibition");
    if (addCurrentExhibitionButton) {
        addCurrentExhibitionButton.addEventListener("click", () => handleAddExhibition("current"));
    }

    // Add event listener for adding a past exhibition
    const addPastExhibitionButton = document.getElementById("add-past-exhibition");
    if (addPastExhibitionButton) {
        addPastExhibitionButton.addEventListener("click", () => handleAddExhibition("past"));
    }

    // Add event listener for adding an upcoming exhibition
    const addUpcomingExhibitionButton = document.getElementById("add-upcoming-exhibition");
    if (addUpcomingExhibitionButton) {
        addUpcomingExhibitionButton.addEventListener("click", () => handleAddExhibition("upcoming"));
    }

    // Add event listener for adding a link
    const addLinkButton = document.getElementById("add-link");
    if (addLinkButton) {
        addLinkButton.addEventListener("click", handleAddLink);
    }

    // Add event listener for adding a link source
    const addLinkSourceButton = document.getElementById("add-link-source");
    if (addLinkSourceButton) {
        addLinkSourceButton.addEventListener("click", handleAddLinkSource);
    }

    // Function to add edit buttons dynamically
    function addEditButtons(isAdmin) {
        const tables = ["#sources-output", "#links-output", "#past-output", "#current-output", "#upcoming-output"];
    
        tables.forEach((selector) => {
            const table = document.querySelector(selector);
            if (table) {
                const header = table.closest("table").querySelector("#edit-options-header");
                if (header) {
                    header.style.display = isAdmin ? "table-cell" : "none"; // Show header only for admin
                }
    
                table.querySelectorAll("tr").forEach((row) => {
                    let actionsCell = row.querySelector(".actions-cell");
    
                    if (isAdmin) {
                        if (!actionsCell) {
                            actionsCell = document.createElement("td");
                            actionsCell.className = "actions-cell";
    
                            // Ensure buttons are added to the correct table rows
                            if (selector === "#links-output" || selector === "#sources-output") {
                                actionsCell.innerHTML = `
                                    <button class="edit-link">Edit</button>
                                    <button class="delete-link">Delete</button>
                                `;
                            } else {
                                actionsCell.innerHTML = `
                                    <button class="edit-exhibition">Edit</button>
                                    <button class="delete-exhibition">Delete</button>
                                `;
                            }
    
                            row.appendChild(actionsCell);
                        }
                    } else if (actionsCell) {
                        actionsCell.remove(); // Remove buttons if not admin
                    }
                });
            }
        });
    }
    


    function handleEdit(exhibition, row) {
        const type = row.closest("tbody").id.replace("-output", ""); // Extract type
        const updatedName = prompt("Edit Exhibition Name:", exhibition.exhibitionname);
        const updatedDate = prompt("Edit Date:", exhibition.date);
        const updatedDescription = prompt("Edit Description:", exhibition.Description);

        if (updatedName && updatedDate && updatedDescription) {
            const updatedData = { exhibitionname: updatedName, date: updatedDate, Description: updatedDescription };

            fetch('/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, exhibitionname: exhibition.exhibitionname, updatedData }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        row.querySelector("td:nth-child(1)").textContent = updatedName;
                        row.querySelector("td:nth-child(2)").textContent = updatedDate;
                        row.querySelector("td:nth-child(3)").textContent = updatedDescription;
                        alert("Exhibition updated successfully.");
                    } else {
                        alert(data.message);
                    }
                })
                .catch(console.error);
        }
    }

    function handleEditLink(item, row, type) {
        const updatedName = prompt(`Edit ${type === "links" ? "Website Name" : "Source Name"}:`, item.websitename);
        const updatedUrl = prompt("Edit Link:", item.link);
        const updatedDescription = prompt("Edit Description:", item.Description);
    
        if (updatedName && updatedUrl && updatedDescription) {
            const updatedData = { websitename: updatedName, link: updatedUrl, Description: updatedDescription };
    
            fetch(`/edit-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ websitename: item.websitename, updatedData, type }), // Include the type
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        row.querySelector("td:nth-child(1)").textContent = updatedName;
                        row.querySelector("td:nth-child(2)").innerHTML = `<a href="${updatedUrl}" target="_blank">${updatedUrl}</a>`;
                        row.querySelector("td:nth-child(3)").textContent = updatedDescription;
                        alert(`${type === "links" ? "Link" : "Link source"} updated successfully.`);
                    } else {
                        alert(data.message); // Show the backend error message
                    }
                })
                .catch((error) => {
                    console.error(`Error editing ${type}:`, error);
                    alert(`An error occurred while editing the ${type}.`);
                });
        }
    }
    



    function handleDelete(exhibition, row) {
        const type = row.closest("tbody").id.replace("-output", "");

        if (confirm("Are you sure you want to delete this exhibition?")) {
            fetch('/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, exhibitionname: exhibition.exhibitionname }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        row.remove();
                        alert("Exhibition deleted successfully.");
                    } else {
                        alert(data.message);
                    }
                })
                .catch(console.error);
        }
    }

    function handleDeleteLink(item, row, type) {
        const confirmationMessage = type === "links"
            ? "Are you sure you want to delete this link?"
            : "Are you sure you want to delete this link source?";
    
        if (confirm(confirmationMessage)) {
            fetch(`/delete-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ websitename: item.websitename, type }), // Include the type
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then((data) => {
                    if (data.success) {
                        row.remove(); // Remove the row from the table
                        alert(`${type === "links" ? "Link" : "Link source"} deleted successfully.`);
                    } else {
                        alert(data.message); // Show the backend error message
                    }
                })
                .catch((error) => {
                    console.error(`Error deleting ${type}:`, error);
                    alert(`An error occurred while deleting the ${type}.`);
                });
        }
    }
    

    function handleAddExhibition(type) {
        const name = prompt("Enter the exhibition name:");
        const date = prompt("Enter the exhibition date:");
        const description = prompt("Enter the exhibition description:");

        if (name && date && description) {
            const newExhibition = { exhibitionname: name, date: date, Description: description };

            fetch('/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, newExhibition }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        alert("Exhibition added successfully.");
                        location.reload(); // Reload to update the table
                    } else {
                        alert(data.message);
                    }
                })
                .catch(console.error);
        }
    }

    function handleAddLink() {
        const name = prompt("Enter the website name:");
        const link = prompt("Enter the website link:");
        const description = prompt("Enter the website description:");

        if (name && link && description) {
            const newLink = { websitename: name, link: link, Description: description };

            fetch('/add-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLink),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        alert("Link added successfully.");
                        location.reload(); // Reload to update the table
                    } else {
                        alert(data.message);
                    }
                })
                .catch(console.error);
        }
    }

    function handleAddLinkSource() {
        const name = prompt("Enter the source name:");
        const link = prompt("Enter the source link:");
        const description = prompt("Enter the source description:");

        if (name && link && description) {
            const newSource = { websitename: name, link: link, Description: description };

            fetch('/add-link-source', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSource),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        alert("Link source added successfully.");
                        location.reload(); // Reload to update the table
                    } else {
                        alert(data.message);
                    }
                })
                .catch(console.error);
        }
    }


    // Attach event listeners to Edit and Delete buttons dynamically
    document.body.addEventListener("click", function (event) {
        // Handle exhibitions
        if (event.target.classList.contains("edit-exhibition")) {
            const row = event.target.closest("tr");
            const name = row.querySelector("td:nth-child(1)").textContent;
            const date = row.querySelector("td:nth-child(2)").textContent;
            const description = row.querySelector("td:nth-child(3)").textContent;

            const exhibition = { exhibitionname: name, date: date, Description: description };
            handleEdit(exhibition, row);
        }

        if (event.target.classList.contains("delete-exhibition")) {
            const row = event.target.closest("tr");
            const name = row.querySelector("td:nth-child(1)").textContent;

            const exhibition = { exhibitionname: name };
            handleDelete(exhibition, row);
        }

        // Handle links (edit)
        if (event.target.classList.contains("edit-link")) {
            const row = event.target.closest("tr");
            const tableId = row.closest("tbody").id;
            const name = row.querySelector("td:nth-child(1)").textContent.trim();
            const url = row.querySelector("td:nth-child(2) a").href;
            const description = row.querySelector("td:nth-child(3)").textContent.trim();
            const item = { websitename: name, link: url, Description: description };
    
            const type = tableId === "links-output" ? "links" : "linkssources"; // Map table ID to type
            handleEditLink(item, row, type);
        }

        if (event.target.classList.contains("delete-link")) {
            const row = event.target.closest("tr");
            const tableId = row.closest("tbody").id; // Identify the table ID
            const name = row.querySelector("td:nth-child(1)").textContent.trim();
            const item = { websitename: name };
    
            const type = tableId === "links-output" ? "links" : "linkssources"; // Map table ID to type
            handleDeleteLink(item, row, type);
        }
    });


    // Function to update visibility based on login state
    function updateVisibility() {
        const adminElements = document.querySelectorAll('.admin-only');

        if (isAdminLoggedIn) {
            loginForm.style.display = "none";
            adminManagementSection.style.display = "block";
            if (logoutSection) logoutSection.style.display = "block";
            addEditButtons(true);
            adminElements.forEach(el => el.style.display = "block"); // Show admin-only elements
        } else {
            loginForm.style.display = "block";
            adminManagementSection.style.display = "none";
            if (logoutSection) logoutSection.style.display = "none";
            addEditButtons(false);
            adminElements.forEach(el => el.style.display = "none"); // Hide admin-only elements
        }
    }
    updateVisibility();

    // Login form submission
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        if (username === "admin" && password === "1234") {
            isAdminLoggedIn = true;
            localStorage.setItem("isAdminLoggedIn", "true");
            alert("Καλώς ήρθατε, Διαχειριστή!");
            updateVisibility();
        } else {
            loginError.style.display = "block";
        }
    });

    // Logout functionality
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            isAdminLoggedIn = false;
            localStorage.setItem("isAdminLoggedIn", "false");
            alert("Έχετε αποσυνδεθεί.");
            updateVisibility();
        });
    }

    // Main menu click handling
    const mainMenuLinks = document.querySelectorAll("nav a[data-menu]");
    const submenus = document.querySelectorAll("aside > div");
    const mainContentSections = document.querySelectorAll("main section");
    const homeSection = document.getElementById("home");

    mainMenuLinks.forEach((link) => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const targetMenu = this.getAttribute("data-menu");

            // Hide all submenus
            submenus.forEach((submenu) => {
                submenu.style.display = "none";
            });

            // Show the relevant submenu
            const submenuToShow = document.querySelector(`#submenu-${targetMenu}`);
            if (submenuToShow) submenuToShow.style.display = "block";

            // Show only the home section by default
            mainContentSections.forEach((section) => {
                if (section !== homeSection) section.style.display = "none";
            });
        });
    });

    // Sidebar links click handling
    const asideLinks = document.querySelectorAll("aside a[data-aside]");
    asideLinks.forEach((link) => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const targetContent = this.getAttribute("data-aside");

            mainContentSections.forEach((section) => {
                section.style.display = "none"; // Hide all
            });

            const sectionToShow = document.getElementById(targetContent);
            if (sectionToShow) sectionToShow.style.display = "block";
        });
    });

    // Populate links table
    fetch("links.json")
        .then((response) => response.json())
        .then((websites) => {
            const placeholder = document.querySelector("#links-output");
            let out = "";
            websites.forEach((website) => {
                out += `
                <tr>
                    <td>${website.websitename}</td>
                    <td><a href="${website.link}" target="_blank">${website.link}</a></td>
                    <td>${website.Description}</td>
                </tr>
                `;
            });
            placeholder.innerHTML = out;
            addEditButtons(isAdminLoggedIn);
        });

    // Populate sources table
    // Populate links-sources table
    fetch("links-sources.json")
        .then((response) => response.json())
        .then((websites) => {
            const placeholder = document.querySelector("#sources-output");
            let out = "";
            websites.forEach((website) => {
                out += `
        <tr>
            <td>${website.websitename}</td>
            <td><a href="${website.link}" target="_blank">${website.link}</a></td>
            <td>${website.Description}</td>
        </tr>
        `;
            });
            placeholder.innerHTML = out;
            addEditButtons(isAdminLoggedIn);
        });


    // Populate exhibitions (past)
    fetch("exhibitions-past.json")
        .then((response) => response.json())
        .then((exhibitions) => {
            const placeholder = document.querySelector("#past-output");
            let out = "";
            exhibitions.forEach((exhibition) => {
                out += `
                <tr>
                    <td>${exhibition.exhibitionname}</td>
                    <td>${exhibition.date}</td>
                    <td>${exhibition.Description}</td>
                </tr>
                `;
            });
            placeholder.innerHTML = out;
            addEditButtons(isAdminLoggedIn);
        });

    // Populate exhibitions (upcoming)
    fetch("exhibitions-upcoming.json")
        .then((response) => response.json())
        .then((exhibitions) => {
            const placeholder = document.querySelector("#upcoming-output");
            let out = "";
            exhibitions.forEach((exhibition) => {
                out += `
                <tr>
                    <td>${exhibition.exhibitionname}</td>
                    <td>${exhibition.date}</td>
                    <td>${exhibition.Description}</td>
                </tr>
                `;
            });
            placeholder.innerHTML = out;
            addEditButtons(isAdminLoggedIn);
        });

    // Populate exhibitions (current)
    fetch("exhibitions-current.json")
        .then((response) => response.json())
        .then((exhibitions) => {
            const placeholder = document.querySelector("#current-output");
            let out = "";
            exhibitions.forEach((exhibition) => {
                out += `
                <tr>
                    <td>${exhibition.exhibitionname}</td>
                    <td>${exhibition.date}</td>
                    <td>${exhibition.Description}</td>
                </tr>
                `;
            });
            placeholder.innerHTML = out;
            addEditButtons(isAdminLoggedIn);
        });

});
