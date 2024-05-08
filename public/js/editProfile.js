document.addEventListener("DOMContentLoaded", e=>{
    const form = document.getElementById("editProfile");
    const btn = document.getElementById("editProfileBtn");

    btn.addEventListener("click", e=> {
        form.submit()
    })
})