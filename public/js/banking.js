function checkSelectedAccType() {

    if (document.getElementById("checking-btn").checked ||
        document.getElementById("savings-btn").checked)
        document.getElementById("submit-btn").disabled = false;
}

function validate(evt) {
    var theEvent = evt || window.event;
  
    if (theEvent.type === 'paste') {
        key = event.clipboardData.getData('text/plain');
    } else {
        var key = theEvent.keyCode || theEvent.which;
        key = String.fromCharCode(key);
    }
    var regex = /[0-9]|\./;
    if( !regex.test(key) ) {
      theEvent.returnValue = false;
      if(theEvent.preventDefault) theEvent.preventDefault();
    }
  }

function emptyDeposit() {
    const depositAmount = document.getElementById("deposit-amount").value;
    if (depositAmount == "") {
        alert("Enter a valid deposit amount");
        return false;
    }
}

function emptyWithdrawal() {
    const withdrawalAmount = document.getElementById("withdrawal-amount").value;
    if (withdrawalAmount == "") {
        alert("Enter a valid withdrawal amount");
        return false;
    }
}