// Dark Mode Toggle
const toggle = document.getElementById("darkModeToggle");
toggle.addEventListener("click", ()=>document.body.classList.toggle("dark"));

// Burger menu
const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav-links");
burger.addEventListener("click", ()=>{
    nav.classList.toggle("nav-active");
    burger.classList.toggle("toggle");
});

// GitHub Projects Dynamic Load
const githubUsername = "umeshrai01";
const githubContainer = document.getElementById("github-projects");

axios.get(`https://api.github.com/users/${githubUsername}/repos?sort=updated`)
.then(res=>{
    const projects = res.data.slice(0,6);
    projects.forEach(proj=>{
        const div = document.createElement("div");
        div.classList.add("project-item");
        div.innerHTML = `
            <h3>${proj.name}</h3>
            <p>${proj.description || "No description available."}</p>
            <p>Language: ${proj.language || "N/A"} | ⭐ ${proj.stargazers_count}</p>
            <a href="${proj.html_url}" target="_blank">GitHub Link</a>
        `;
        githubContainer.appendChild(div);
    });
})
.catch(err=>console.error(err));

// Scroll Animation
const faders = document.querySelectorAll('.fade-in');
const appearOptions = {threshold:0.1, rootMargin:"0px 0px -50px 0px"};
const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll){
    entries.forEach(entry=>{
        if(!entry.isIntersecting) return;
        entry.target.classList.add('show');
        appearOnScroll.unobserve(entry.target);
    });
}, appearOptions);

faders.forEach(fader=>appearOnScroll.observe(fader));
