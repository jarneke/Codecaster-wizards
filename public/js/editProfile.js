// when DOM is loaded
document.addEventListener("DOMContentLoaded", e => {
    // get form and submit button
    const form = document.getElementById("editProfile");
    const btn = document.getElementById("editProfileBtn");
    // if button is presses
    btn.addEventListener("click", e => {
        // submit form
        form.submit()
    })
})