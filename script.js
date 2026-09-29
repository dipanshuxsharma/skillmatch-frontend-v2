/* =========================================
   SKILLMATCH - SCRIPT.JS
========================================= */


const API_BASE_URL =
    "https://skillmatch-job-portal-backend-1.onrender.com";

/* =========================================
   MODAL HELPERS
========================================= */

function showModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.style.display = "flex";
    }
}


function hideModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.style.display = "none";
    }
}


/* =========================================
   LOGIN
========================================= */

function openLogin() {
    showModal("loginModal");
}


function closeLogin() {
    hideModal("loginModal");
}


async function handleLogin(event) {

    event.preventDefault();

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    try {

        const response = await fetch(
            API_BASE_URL + "/api/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );

        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (!response.ok) {

            alert(
                data.message ||
                data.error ||
                "Login failed"
            );

            return;
        }

        if (!data.token) {

            alert("Login response mein token nahi mila.");

            return;
        }

        localStorage.setItem(
            "skillmatchToken",
            data.token
        );

        localStorage.setItem(
            "skillmatchUser",
            JSON.stringify(data.user || {})
        );

        alert("Login successful!");

        document
            .getElementById("loginForm")
            .reset();

        closeLogin();

        loadJobs();

    } catch (error) {

        console.error("Login error:", error);

        alert(
            "Backend se connection nahi ho pa raha."
        );
    }
}


/* =========================================
   REGISTER
========================================= */

function openRegister() {
    showModal("registerModal");
}


function closeRegister() {
    hideModal("registerModal");
}


async function handleRegister(event) {

    event.preventDefault();

    const name =
        document
            .getElementById("registerName")
            .value
            .trim();

    const email =
        document
            .getElementById("registerEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("registerPassword")
            .value;

    const role =
        document
            .getElementById("registerRole")
            .value;

    try {

        const response = await fetch(
            API_BASE_URL + "/api/auth/register",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password,
                    role: role
                })
            }
        );

        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (!response.ok) {

            alert(
                data.message ||
                data.error ||
                "Registration failed"
            );

            return;
        }

        alert("Registration successful!");

        document
            .getElementById("registerForm")
            .reset();

        closeRegister();

        openLogin();

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        alert(
            "Backend se connection nahi ho pa raha."
        );
    }
}


/* =========================================
   RESUME
========================================= */

function openResume() {

    const token =
        localStorage.getItem("skillmatchToken");

    if (!token) {

        alert("Please login first.");

        openLogin();

        return;
    }

    showModal("resumeModal");
}


function closeResume() {
    hideModal("resumeModal");
}


async function handleResumeUpload(event) {

    event.preventDefault();

    const token =
        localStorage.getItem("skillmatchToken");

    if (!token) {

        alert("Please login first.");

        return;
    }

    const fileInput =
        document.getElementById("resumeFile");

    const result =
        document.getElementById("resumeResult");

    if (
        !fileInput ||
        fileInput.files.length === 0
    ) {

        alert("Please select a PDF resume.");

        return;
    }

    const file =
        fileInput.files[0];

    if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
    ) {

        alert("Only PDF files are allowed.");

        return;
    }

    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );

    if (result) {

        result.innerHTML =
            "<p>⏳ Uploading resume...</p>";
    }

    try {

        const response = await fetch(
            API_BASE_URL + "/api/resumes/process",
            {
                method: "POST",

                headers: {
                    "Authorization":
                        "Bearer " + token
                },

                body: formData
            }
        );

        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (response.status === 401) {

            clearSession();

            closeResume();

            alert(
                "Session expired. Please login again."
            );

            openLogin();

            return;
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Resume upload failed"
            );
        }

        if (result) {

            result.innerHTML = `
                <div style="
                    padding:15px;
                    border:1px solid #a7f3d0;
                    background:#ecfdf5;
                    border-radius:10px;
                ">

                    <strong style="color:#047857;">
                        ✅ Resume uploaded successfully!
                    </strong>

                    <p style="margin-top:8px;">
                        <strong>File:</strong>
                        ${escapeHtml(
                            data.fileName || file.name
                        )}
                    </p>

                    <p style="margin-top:8px;">
                        <strong>Skills:</strong>
                        ${escapeHtml(
                            data.skills ||
                            "Skills extracted successfully"
                        )}
                    </p>

                </div>
            `;
        }

        fileInput.value = "";

        alert(
            "Resume uploaded successfully!"
        );

    } catch (error) {

        console.error(
            "Resume upload error:",
            error
        );

        if (result) {

            result.innerHTML = `
                <p style="color:red;">
                    ❌ ${escapeHtml(error.message)}
                </p>
            `;
        }

        alert(
            "Resume upload failed: " +
            error.message
        );
    }
}


/* =========================================
   APPLICATIONS
========================================= */

function openApplications() {

    const token =
        localStorage.getItem("skillmatchToken");

    if (!token) {

        alert("Please login first.");

        openLogin();

        return;
    }

    showModal("applicationsModal");

    loadMyApplications();
}


function closeApplications() {
    hideModal("applicationsModal");
}


async function loadMyApplications() {

    const container =
        document.getElementById(
            "applicationsContainer"
        );

    if (!container) {
        return;
    }

    const token =
        localStorage.getItem(
            "skillmatchToken"
        );

    if (!token) {

        container.innerHTML =
            "<p>Please login to view applications.</p>";

        return;
    }

    container.innerHTML =
        "<p>⏳ Loading applications...</p>";

    try {

        const response = await fetch(
            API_BASE_URL + "/api/applications/my",
            {
                method: "GET",

                headers: {
                    "Authorization":
                        "Bearer " + token
                }
            }
        );

        if (response.status === 401) {

            clearSession();

            container.innerHTML =
                "<p>Session expired. Please login again.</p>";

            return;
        }

        if (response.status === 403) {

            container.innerHTML =
                "<p>Only job seekers can view applications.</p>";

            return;
        }

        if (!response.ok) {

            throw new Error(
                "Failed to load applications"
            );
        }

        const applications =
            await response.json();

        if (
            !Array.isArray(applications) ||
            applications.length === 0
        ) {

            container.innerHTML = `
                <div style="
                    text-align:center;
                    padding:30px;
                ">

                    <div style="font-size:40px;">
                        📭
                    </div>

                    <h3>
                        No Applications Yet
                    </h3>

                    <p>
                        You have not applied for any jobs yet.
                    </p>

                </div>
            `;

            return;
        }

        container.innerHTML = "";

        applications.forEach(application => {

            const card =
                document.createElement("div");

            card.style.cssText = `
                border:1px solid #e2e8f0;
                border-radius:12px;
                padding:18px;
                margin-bottom:15px;
                background:white;
            `;

            const title =
                application.jobTitle ||
                "Job Title";

            const company =
                application.company ||
                "Company";

            const jobId =
                application.jobId ||
                "-";

            const status =
                (
                    application.status ||
                    "APPLIED"
                ).toUpperCase();

            card.innerHTML = `

                <h3>
                    ${escapeHtml(title)}
                </h3>

                <p>
                    🏢 ${escapeHtml(company)}
                </p>

                <p>
                    Job ID:
                    ${escapeHtml(String(jobId))}
                </p>

                <p>
                    Status:
                    <strong>
                        ${escapeHtml(status)}
                    </strong>
                </p>

            `;

            container.appendChild(card);
        });

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <p style="color:red;">
                ❌ Unable to load applications.
            </p>
        `;
    }
}


/* =========================================
   JOB DETAILS
========================================= */

function closeJobDetails() {
    hideModal("jobDetailsModal");
}


/* =========================================
   LOAD JOBS
========================================= */

async function loadJobs() {

    const container =
        document.getElementById(
            "jobContainer"
        );

    if (!container) {
        return;
    }

    const token =
        localStorage.getItem(
            "skillmatchToken"
        );

    const searchInput =
        document.getElementById(
            "jobSearch"
        );

    const searchText =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";

    container.innerHTML =
        "<p>⏳ Loading jobs...</p>";

    try {

        const headers = {};

        if (token) {

            headers["Authorization"] =
                "Bearer " + token;
        }

        const response = await fetch(
            API_BASE_URL + "/api/jobs",
            {
                method: "GET",
                headers: headers
            }
        );

        if (response.status === 401) {

            container.innerHTML = `
                <div style="
                    text-align:center;
                    padding:30px;
                ">

                    <p>
                        Please login to view jobs.
                    </p>

                    <button
                        class="btn-primary"
                        onclick="openLogin()"
                    >
                        Login
                    </button>

                </div>
            `;

            return;
        }

        if (response.status === 403) {

            container.innerHTML =
                "<p>Access denied.</p>";

            return;
        }

        if (!response.ok) {

            throw new Error(
                "Failed to load jobs"
            );
        }

        const jobs =
            await response.json();

        const filteredJobs =
            jobs.filter(job => {

                if (!searchText) {
                    return true;
                }

                const title =
                    (
                        job.title || ""
                    ).toLowerCase();

                const company =
                    (
                        job.company || ""
                    ).toLowerCase();

                const location =
                    (
                        job.location || ""
                    ).toLowerCase();

                const skills =
                    (
                        job.requiredSkills || ""
                    ).toLowerCase();

                return (
                    title.includes(searchText) ||
                    company.includes(searchText) ||
                    location.includes(searchText) ||
                    skills.includes(searchText)
                );
            });

        if (filteredJobs.length === 0) {

            container.innerHTML =
                "<p>No jobs found.</p>";

            return;
        }

        container.innerHTML = "";

        filteredJobs.forEach(job => {

            const card =
                document.createElement("div");

            card.className =
                "job-card";

            card.innerHTML = `

                <div class="job-card-content">

                    <h3>
                        ${escapeHtml(
                            job.title ||
                            "Job Title"
                        )}
                    </h3>

                    <p>
                        🏢
                        ${escapeHtml(
                            job.company ||
                            "Company"
                        )}
                    </p>

                    <p>
                        📍
                        ${escapeHtml(
                            job.location ||
                            "Location"
                        )}
                    </p>

                    <p>
                        🛠
                        ${escapeHtml(
                            job.requiredSkills ||
                            "Skills"
                        )}
                    </p>

                    <p>
                        💰 ₹
                        ${escapeHtml(
                            String(
                                job.salary ??
                                "Not disclosed"
                            )
                        )}
                    </p>

                </div>

                <div style="margin-top:15px;">

                    <button
                        type="button"
                        class="btn-primary"
                    >
                        View Job
                    </button>

                </div>
            `;

            const button =
                card.querySelector(
                    "button"
                );

            button.addEventListener(
                "click",
                function() {
                    viewJob(job.id);
                }
            );

            container.appendChild(card);
        });

    } catch (error) {

        console.error(
            "Load jobs error:",
            error
        );

        container.innerHTML = `
            <div style="
                text-align:center;
                padding:30px;
            ">

                <p>
                    ❌ Unable to load jobs.
                </p>

                <button
                    class="btn-primary"
                    onclick="loadJobs()"
                >
                    Try Again
                </button>

            </div>
        `;
    }
}


/* =========================================
   VIEW JOB
========================================= */

async function viewJob(jobId) {

    const modal =
        document.getElementById(
            "jobDetailsModal"
        );

    const content =
        document.getElementById(
            "jobDetailsContent"
        );

    if (!modal || !content) {
        return;
    }

    modal.style.display = "flex";

    content.innerHTML =
        "<p>⏳ Loading job details...</p>";

    const token =
        localStorage.getItem(
            "skillmatchToken"
        );

    try {

        const headers = {};

        if (token) {

            headers["Authorization"] =
                "Bearer " + token;
        }

        const response = await fetch(
            API_BASE_URL + "/api/jobs/" + jobId,
            {
                method: "GET",
                headers: headers
            }
        );

        if (response.status === 401) {

            content.innerHTML = `

                <h2>
                    Login Required
                </h2>

                <p>
                    Please login to view this job.
                </p>

                <button
                    class="btn-primary"
                    id="detailsLoginButton"
                >
                    Login
                </button>

            `;

            document
                .getElementById(
                    "detailsLoginButton"
                )
                .onclick = function() {

                    closeJobDetails();

                    openLogin();
                };

            return;
        }

        if (response.status === 403) {

            content.innerHTML = `
                <h2>
                    Access Denied
                </h2>

                <p>
                    You are not authorized to view this job.
                </p>
            `;

            return;
        }

        if (response.status === 404) {

            content.innerHTML = `
                <h2>
                    Job Not Found
                </h2>

                <p>
                    This job does not exist.
                </p>
            `;

            return;
        }

        if (!response.ok) {

            throw new Error(
                "Unable to fetch job"
            );
        }

        const job =
            await response.json();

        content.innerHTML = `

            <div>

                <h2>
                    ${escapeHtml(
                        job.title ||
                        "Job Title"
                    )}
                </h2>

                <h3>
                    ${escapeHtml(
                        job.company ||
                        "Company"
                    )}
                </h3>

                <p>
                    📍
                    ${escapeHtml(
                        job.location ||
                        "Location"
                    )}
                </p>

                <p>
                    💰 ₹
                    ${escapeHtml(
                        String(
                            job.salary ??
                            "Not disclosed"
                        )
                    )}
                </p>

                <p>
                    🛠
                    ${escapeHtml(
                        job.requiredSkills ||
                        "Not specified"
                    )}
                </p>

                <h4>
                    Job Description
                </h4>

                <p>
                    ${escapeHtml(
                        job.description ||
                        "No description available."
                    )}
                </p>

                <div style="
                    display:flex;
                    gap:10px;
                    flex-wrap:wrap;
                    margin-top:20px;
                ">

                    <button
                        class="btn-primary"
                        id="applyJobButton"
                        type="button"
                    >
                        Apply Now
                    </button>

                    <button
                        class="btn-primary"
                        id="matchJobButton"
                        type="button"
                    >
                        🎯 Match My Resume
                    </button>

                </div>

                <div
                    id="matchResult"
                    style="margin-top:20px;"
                ></div>

            </div>
        `;

        document
            .getElementById(
                "applyJobButton"
            )
            .onclick = function() {

                applyForJob(job.id);
            };

        document
            .getElementById(
                "matchJobButton"
            )
            .onclick = function() {

                matchResumeWithJob(job.id);
            };

    } catch (error) {

        console.error(error);

        content.innerHTML = `
            <h2>
                Something went wrong
            </h2>

            <p>
                Unable to load job details.
            </p>
        `;
    }
}


/* =========================================
   APPLY FOR JOB
========================================= */

async function applyForJob(jobId) {

    const token =
        localStorage.getItem(
            "skillmatchToken"
        );

    if (!token) {

        alert("Please login first.");

        closeJobDetails();

        openLogin();

        return;
    }

    try {

        const response = await fetch(
            API_BASE_URL +
            "/api/applications/apply/" +
            jobId,
            {
                method: "POST",

                headers: {
                    "Authorization":
                        "Bearer " + token
                }
            }
        );

        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (response.status === 401) {

            clearSession();

            closeJobDetails();

            openLogin();

            return;
        }

        if (response.status === 403) {

            alert(
                "Only job seekers can apply for jobs."
            );

            return;
        }

        if (response.status === 409) {

            alert(
                "You have already applied for this job."
            );

            return;
        }

        if (!response.ok) {

            alert(
                data.message ||
                data.error ||
                "Unable to apply for this job."
            );

            return;
        }

        alert(
            "✅ Application submitted successfully!"
        );

    } catch (error) {

        console.error(
            "Apply error:",
            error
        );

        alert(
            "Backend se connection nahi ho pa raha."
        );
    }
}


/* =========================================
   MATCH RESUME WITH JOB
========================================= */

async function matchResumeWithJob(jobId) {

    const token =
        localStorage.getItem(
            "skillmatchToken"
        );

    if (!token) {

        alert("Please login first.");

        closeJobDetails();

        openLogin();

        return;
    }

    const result =
        document.getElementById(
            "matchResult"
        );

    const button =
        document.getElementById(
            "matchJobButton"
        );

    if (result) {

        result.innerHTML =
            "<p>🔍 Analyzing your resume...</p>";
    }

    if (button) {

        button.disabled = true;

        button.textContent =
            "Analyzing...";
    }

    try {

        const response = await fetch(
            API_BASE_URL +
            "/api/match/" +
            jobId,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        "Bearer " + token
                }
            }
        );

        if (response.status === 401) {

            clearSession();

            closeJobDetails();

            openLogin();

            return;
        }

        if (response.status === 403) {

            if (result) {

                result.innerHTML =
                    "<p>Only job seekers can use resume matching.</p>";
            }

            return;
        }

        if (!response.ok) {

            throw new Error(
                "Resume matching failed."
            );
        }

        const data =
            await response.json();

        const percentage =
            Number(
                data.matchPercentage || 0
            );

        const matchedSkills =
            data.matchedSkills || [];

        const missingSkills =
            data.missingSkills || [];

        const matchedText =
            matchedSkills.length > 0
                ? matchedSkills
                    .map(
                        skill =>
                            "✓ " +
                            escapeHtml(skill)
                    )
                    .join(", ")
                : "No matching skills";

        const missingText =
            missingSkills.length > 0
                ? missingSkills
                    .map(
                        skill =>
                            "✕ " +
                            escapeHtml(skill)
                    )
                    .join(", ")
                : "No missing skills 🎉";

        if (result) {

            result.innerHTML = `

                <div style="
                    padding:20px;
                    border:1px solid #e2e8f0;
                    border-radius:12px;
                    background:#f8fafc;
                ">

                    <h3>
                        🎯 Resume Match
                    </h3>

                    <div style="
                        font-size:42px;
                        font-weight:bold;
                        margin:15px 0;
                    ">
                        ${percentage}%
                    </div>

                    <p>
                        <strong>
                            ✅ Matched Skills:
                        </strong>
                    </p>

                    <p>
                        ${matchedText}
                    </p>

                    <p style="margin-top:12px;">
                        <strong>
                            ❌ Missing Skills:
                        </strong>
                    </p>

                    <p>
                        ${missingText}
                    </p>

                </div>
            `;
        }

    } catch (error) {

        console.error(
            "Matching error:",
            error
        );

        if (result) {

            result.innerHTML = `
                <p style="color:red;">
                    ❌ Unable to calculate resume match.
                </p>
            `;
        }

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "🎯 Match My Resume";
        }
    }
}


/* =========================================
   POST JOB
========================================= */

function openPostJob() {

    const token =
        localStorage.getItem(
            "skillmatchToken"
        );

    if (!token) {

        alert("Please login first.");

        openLogin();

        return;
    }

    showModal("postJobModal");
}


function closePostJob() {
    hideModal("postJobModal");
}


async function handlePostJob(event) {

    event.preventDefault();

    const token =
        localStorage.getItem(
            "skillmatchToken"
        );

    if (!token) {

        alert("Please login first.");

        return;
    }

    const title =
        document
            .getElementById("jobTitle")
            .value
            .trim();

    const company =
        document
            .getElementById("jobCompany")
            .value
            .trim();

    const location =
        document
            .getElementById("jobLocation")
            .value
            .trim();

    const salary =
        Number(
            document
                .getElementById("jobSalary")
                .value
        );

    const requiredSkills =
        document
            .getElementById("jobSkills")
            .value
            .trim();

    const description =
        document
            .getElementById("jobDescription")
            .value
            .trim();

    try {

        const response = await fetch(
            API_BASE_URL + "/api/jobs",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        "Bearer " + token
                },

                body: JSON.stringify({
                    title: title,
                    company: company,
                    location: location,
                    salary: salary,
                    requiredSkills:
                        requiredSkills,
                    description: description
                })
            }
        );

        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (response.status === 401) {

            clearSession();

            closePostJob();

            openLogin();

            return;
        }

        if (response.status === 403) {

            alert(
                "Only recruiters can post jobs."
            );

            return;
        }

        if (!response.ok) {

            alert(
                data.message ||
                data.error ||
                "Job posting failed."
            );

            return;
        }

        alert(
            "✅ Job posted successfully!"
        );

        document
            .getElementById("postJobForm")
            .reset();

        closePostJob();

        loadJobs();

    } catch (error) {

        console.error(
            "Post job error:",
            error
        );

        alert(
            "Unable to connect to backend."
        );
    }
}


/* =========================================
   MY POSTED JOBS
========================================= */

function openMyPostedJobs() {

    const token =
        localStorage.getItem(
            "skillmatchToken"
        );

    if (!token) {

        alert("Please login first.");

        openLogin();

        return;
    }

    showModal("myPostedJobsModal");

    loadMyPostedJobs();
}


function closeMyPostedJobs() {
    hideModal("myPostedJobsModal");
}


async function loadMyPostedJobs() {

    const container =
        document.getElementById(
            "myPostedJobsContainer"
        );

    const token =
        localStorage.getItem(
            "skillmatchToken"
        );

    if (!container) {
        return;
    }

    if (!token) {

        container.innerHTML =
            "<p>Please login first.</p>";

        return;
    }

    container.innerHTML =
        "<p>⏳ Loading jobs...</p>";

    try {

        const response = await fetch(
            API_BASE_URL + "/api/jobs",
            {
                method: "GET",

                headers: {
                    "Authorization":
                        "Bearer " + token
                }
            }
        );

        if (response.status === 401) {

            clearSession();

            container.innerHTML =
                "<p>Session expired. Please login again.</p>";

            return;
        }

        if (!response.ok) {

            throw new Error(
                "Unable to load jobs."
            );
        }

        const jobs =
            await response.json();

        if (
            !Array.isArray(jobs) ||
            jobs.length === 0
        ) {

            container.innerHTML =
                "<p>No jobs found.</p>";

            return;
        }

        container.innerHTML = "";

        jobs.forEach(job => {

            const card =
                document.createElement("div");

            card.style.cssText = `
                border:1px solid #e2e8f0;
                border-radius:12px;
                padding:18px;
                margin-top:15px;
                background:white;
            `;

            card.innerHTML = `

                <h3>
                    ${escapeHtml(
                        job.title ||
                        "Job Title"
                    )}
                </h3>

                <p>
                    <strong>Company:</strong>
                    ${escapeHtml(
                        job.company ||
                        "Company"
                    )}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${escapeHtml(
                        job.location ||
                        "Location"
                    )}
                </p>

                <p>
                    <strong>Salary:</strong>
                    ₹${escapeHtml(
                        String(
                            job.salary ??
                            "Not disclosed"
                        )
                    )}
                </p>

                <p>
                    <strong>Skills:</strong>
                    ${escapeHtml(
                        job.requiredSkills ||
                        "Not specified"
                    )}
                </p>

                <p>
                    ${escapeHtml(
                        job.description || ""
                    )}
                </p>

                <div style="
                    margin-top:15px;
                    display:flex;
                    gap:10px;
                    flex-wrap:wrap;
                ">

                    <button
                        type="button"
                        class="btn-primary"
                        onclick="openEditJob(${job.id})"
                    >
                        ✏️ Edit Job
                    </button>

                    <button
                        type="button"
                        class="btn-primary"
                        onclick="deleteJob(${job.id})"
                    >
                        🗑️ Delete Job
                    </button>

                </div>
            `;

            container.appendChild(card);
        });

    } catch (error) {

        console.error(
            "My Posted Jobs error:",
            error
        );

        container.innerHTML = `
            <p style="color:red;">
                ❌ ${escapeHtml(error.message)}
            </p>
        `;
    }
}


/* =========================================
   DELETE JOB
========================================= */

async function deleteJob(jobId) {

    const token =
        localStorage.getItem(
            "skillmatchToken"
        );

    if (!token) {

        alert("Please login first.");

        openLogin();

        return;
    }

    const confirmed =
        confirm(
            "Are you sure you want to delete this job?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            API_BASE_URL +
            "/api/jobs/" +
            jobId,
            {
                method: "DELETE",

                headers: {
                    "Authorization":
                        "Bearer " + token
                }
            }
        );

        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (response.status === 401) {

            clearSession();

            openLogin();

            return;
        }

        if (response.status === 403) {

            alert(
                "Only recruiters can delete jobs."
            );

            return;
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Job deletion failed."
            );
        }

        alert(
            "✅ Job deleted successfully!"
        );

        await loadMyPostedJobs();

        loadJobs();

    } catch (error) {

        console.error(
            "Delete job error:",
            error
        );

        alert(
            "❌ " + error.message
        );
    }
}


/* =========================================
   EDIT JOB
========================================= */

function closeEditJob() {
    hideModal("editJobModal");
}


async function openEditJob(jobId) {

    const token =
        localStorage.getItem(
            "skillmatchToken"
        );

    if (!token) {

        alert("Please login first.");

        openLogin();

        return;
    }

    try {

        const response = await fetch(
            API_BASE_URL +
            "/api/jobs/" +
            jobId,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        "Bearer " + token
                }
            }
        );

        if (response.status === 401) {

            clearSession();

            openLogin();

            return;
        }

        if (response.status === 403) {

            alert(
                "You are not allowed to edit this job."
            );

            return;
        }

        if (!response.ok) {

            throw new Error(
                "Unable to load job."
            );
        }

        const job =
            await response.json();

        document.getElementById(
            "editJobId"
        ).value =
            job.id;

        document.getElementById(
            "editJobTitle"
        ).value =
            job.title || "";

        document.getElementById(
            "editJobCompany"
        ).value =
            job.company || "";

        document.getElementById(
            "editJobLocation"
        ).value =
            job.location || "";

        document.getElementById(
            "editJobSalary"
        ).value =
            job.salary || "";

        document.getElementById(
            "editJobSkills"
        ).value =
            job.requiredSkills || "";

        document.getElementById(
            "editJobDescription"
        ).value =
            job.description || "";

        document.getElementById(
            "editJobResult"
        ).innerHTML = "";

        showModal("editJobModal");

    } catch (error) {

        console.error(
            "Edit job load error:",
            error
        );

        alert(
            "❌ " + error.message
        );
    }
}


async function handleEditJob(event) {

    event.preventDefault();

    const token =
        localStorage.getItem(
            "skillmatchToken"
        );

    if (!token) {

        alert("Please login first.");

        return;
    }

    const jobId =
        document.getElementById(
            "editJobId"
        ).value;

    const title =
        document.getElementById(
            "editJobTitle"
        ).value.trim();

    const company =
        document.getElementById(
            "editJobCompany"
        ).value.trim();

    const location =
        document.getElementById(
            "editJobLocation"
        ).value.trim();

    const salary =
        Number(
            document.getElementById(
                "editJobSalary"
            ).value
        );

    const requiredSkills =
        document.getElementById(
            "editJobSkills"
        ).value.trim();

    const description =
        document.getElementById(
            "editJobDescription"
        ).value.trim();

    const result =
        document.getElementById(
            "editJobResult"
        );

    if (result) {

        result.innerHTML =
            "<p>⏳ Updating job...</p>";
    }

    try {

        const response = await fetch(
            API_BASE_URL +
            "/api/jobs/" +
            jobId,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        "Bearer " + token
                },

                body: JSON.stringify({
                    title: title,
                    company: company,
                    location: location,
                    salary: salary,
                    requiredSkills:
                        requiredSkills,
                    description: description
                })
            }
        );

        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (response.status === 401) {

            clearSession();

            closeEditJob();

            openLogin();

            return;
        }

        if (response.status === 403) {

            if (result) {

                result.innerHTML =
                    "<p style='color:red;'>Only recruiters can edit jobs.</p>";
            }

            return;
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Job update failed."
            );
        }

        if (result) {

            result.innerHTML =
                "<p style='color:green;'>✅ Job updated successfully!</p>";
        }

        setTimeout(
            function() {

                closeEditJob();

                loadMyPostedJobs();

                loadJobs();

            },
            700
        );

    } catch (error) {

        console.error(
            "Update job error:",
            error
        );

        if (result) {

            result.innerHTML = `
                <p style="color:red;">
                    ❌ ${escapeHtml(error.message)}
                </p>
            `;
        }
    }
}


/* =========================================
   LOGOUT
========================================= */

function clearSession() {

    localStorage.removeItem(
        "skillmatchToken"
    );

    localStorage.removeItem(
        "skillmatchUser"
    );
}


function logout() {

    clearSession();

    alert(
        "Logged out successfully."
    );

    window.location.reload();
}


/* =========================================
   SCROLL TO JOBS
========================================= */

function scrollToJobs() {

    const jobs =
        document.getElementById("jobs");

    if (jobs) {

        jobs.scrollIntoView({
            behavior: "smooth"
        });
    }
}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================
   OUTSIDE MODAL CLICK
========================================= */

window.addEventListener(
    "click",
    function(event) {

        const modalIds = [
            "loginModal",
            "registerModal",
            "jobDetailsModal",
            "applicationsModal",
            "resumeModal",
            "postJobModal",
            "myPostedJobsModal",
            "editJobModal"
        ];

        modalIds.forEach(function(id) {

            const modal =
                document.getElementById(id);

            if (
                modal &&
                event.target === modal
            ) {

                modal.style.display = "none";
            }
        });
    }
);


/* =========================================
   ESC KEY
========================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key !== "Escape") {
            return;
        }

        closeLogin();
        closeRegister();
        closeJobDetails();
        closeApplications();
        closeResume();
        closePostJob();
        closeMyPostedJobs();
        closeEditJob();
    }
);


/* =========================================
   DOM READY
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const registerForm =
            document.getElementById(
                "registerForm"
            );

        const loginForm =
            document.getElementById(
                "loginForm"
            );

        const resumeForm =
            document.getElementById(
                "resumeForm"
            );

        const postJobForm =
            document.getElementById(
                "postJobForm"
            );

        const editJobForm =
            document.getElementById(
                "editJobForm"
            );


        if (registerForm) {

            registerForm.addEventListener(
                "submit",
                handleRegister
            );
        }


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLogin
            );
        }


        if (resumeForm) {

            resumeForm.addEventListener(
                "submit",
                handleResumeUpload
            );
        }


        if (postJobForm) {

            postJobForm.addEventListener(
                "submit",
                handlePostJob
            );
        }


        if (editJobForm) {

            editJobForm.addEventListener(
                "submit",
                handleEditJob
            );
        }


        loadJobs();

    }
);