const hiApiBtn = document.getElementById("hiApi_btn");
const dataP = document.getElementById("data");

hiApiBtn.addEventListener("click", fetchHiData);

function fetchHiData() {
  fetch("/hi")
    .then(function (res) { //fetch- '/hi/'라는 경로 서버에 네트워크 요청을 보냄
      return res.text();   //promise값 반환
    })
    .then(function (data) { //data에 res.text()값 
      if (dataP.textContent === data) {
        const goReset = confirm("이미 전송이 완료되었습니다. 초기화 할까요?");
        if(goReset == true) dataP.textContent = '없음';
      } 
      else {
        dataP.textContent = data;
      }
    });
}
