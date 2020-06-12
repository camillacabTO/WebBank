function checkSubmit() {
    if (!document.getElementById("open-account").checked) {
        document.getElementById("invalid-msg").style.display = 'inherit';
        setTimeout(() => {
            document.getElementById("invalid-msg").style.display = 'none';
        },2500);
        return false;
    } else {
        return true;
    }
};

// function openAccount(params) {
    
// }