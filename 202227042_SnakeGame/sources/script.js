/* 전역 및 초기 설정 */
// 캔버스 설정
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 상태 설정
let gameStarted = false; // 게임 시작 상태 변수
let timeElapsed = 0; // 게임 시간

// 뱀의 속도 설정
const snakeSpeed = 0.8; // 기본 속도
const snakeFastSpeed = 1.5; // 가속 시 속도
const snakeRadius = 8; // 뱀의 몸통 크기(반지름)

// 난이도와 관련된 변수
let lastDifficultyIncrease = 0;
const difficultyInterval = 10; // 난이도가 증가하는 시간 간격 (초)

// 초기 뱀 몸통 배열 설정
let snake = [
  { x: canvas.width / 2, y: canvas.height / 2 }, // 머리 위치
  { x: canvas.width / 2, y: canvas.height / 2 - (snakeRadius * 2) / 3 }, // 몸통 중간
  { x: canvas.width / 2, y: canvas.height / 2 - (snakeRadius * 4) / 3 }, // 꼬리 위치
];

// 사과 설정
const appleRadius = 7; // 사과 크기(반지름)
let applePos = getRandomPosition(); // 사과 초기 위치

// 마우스 이벤트를 위한 변수 설정
let isFast = false; // 가속 상태
let lastMousePos = { x: canvas.width / 2, y: canvas.height / 2 }; // 마지막 마우스 위치

/* 처음화면 */
window.onload = function () {
  // 게임 관련 요소를 가져옴
  var titleScreen = document.getElementById("titleScreen"); // 타이틀 스크린
  var startButton = document.getElementById("startButton"); // 시작버튼
  var instructButton = document.getElementById("instructButton"); // 설명버튼
  var inGame = document.getElementById("inGame"); // 인게임 창

  // 게임 시작 버튼 클릭시
  startButton.addEventListener("click", function () {
    // 타이틀 화면을 숨기고, inGame을 표시
    titleScreen.style.display = "none";
    inGame.style.display = "block";
    gameStarted = true; // 게임 시작 상태를 true로 설정

    // 게임 시작 시간을 설정
    startTime = Date.now();

    render(); // 초기 Render
    gameLoop(); // 게임 루프 시작
  });

  // 게임 설명 버튼 클릭시
  instructButton.addEventListener("click", function () {});

  // 처음 시작시 inGame창을 가리고 타이틀 화면만 보이게 하기
  inGame.style.display = "none";
};

// 마우스 이벤트 리스너
canvas.addEventListener("mousemove", (event) => {
  lastMousePos = getMousePos(canvas, event); // 마우스 움직임 감지
});

canvas.addEventListener("mousedown", () => {
  isFast = true; // 마우스 클릭 시 가속
});

canvas.addEventListener("mouseup", () => {
  isFast = false; // 마우스 클릭 해제 시 가속 해제
});

/*--------------------------------------------------------------------*/
// 난이도 증가 함수
function increaseDifficulty() {
  // 난이도 증가시킬 항목을 랜덤으로 선택
  const increase = Math.floor(Math.random() * 4);
  let message = "";

  // 랜덤으로 선택된 난이도 항목에 따라 증가시키기
  switch (increase) {
    case 0:
      obstacleChance += 0.005; // 장애물 생성 확률 증가
      message = "장애물 생성 확률이 증가했습니다!";
      break;
    case 1:
      maxObstacles += 1; // 장애물 최대 개수 증가
      message = "장애물 최대 개수가 증가했습니다!";
      break;
    case 2:
      // 모든 장애물의 크기를 증가시키기
      maxSize += 1;
      minSize += 1;
      message = "장애물의 크기가 증가했습니다!";
      break;
    case 3:
      // 모든 장애물의 속도를 증가시키기
      maxSpeed += 0.1;
      minSpeed += 0.1;
      message = "장애물의 속도가 증가했습니다!";
      break;
  }
  showDifficultyIncreaseMessage(message); // 난이도 증가 메시지 표시
}

// 난이도 증가 메시지 표시 함수
function showDifficultyIncreaseMessage(message) {
  const messageElement = document.getElementById("difficultyMsg");
  messageElement.textContent = message;
  messageElement.style.display = "block"; // 메시지 요소 표시

  // 3초 후에 메시지를 숨김
  setTimeout(() => {
    messageElement.style.display = "none";
  }, 3000);
}

// 상태 업데이트 함수
function updateStats() {
  timeElapsed = Math.floor((Date.now() - startTime) / 1000); // 시작부터 경과한 시간(초)
  document.getElementById("time").textContent = timeElapsed; // 시간 표시 업데이트
  document.getElementById("length").textContent = snake.length; // 길이 표시 업데이트
}

// 마우스 위치 계산 함수
function getMousePos(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

// 랜덤 위치 생성 함수
function getRandomPosition() {
  const x = Math.random() * (canvas.width - 10 * appleRadius) + appleRadius;
  const y = Math.random() * (canvas.height - 10 * appleRadius) + appleRadius;
  return { x, y };
}

// 이징 관련 변수
let easeAmount = 0.1; // 이징이 적용되는 정도 (0 ~ 1 사이의 값)
let easeTarget = (snakeRadius * 4) / 3; // 목표 간격 (가속하지 않을 때)
let easeCurrent = easeTarget; // 현재 간격
let easeSpeed = 0.05; // 이징 속도

// 뱀 이동 함수
function moveSnake(targetPos) {
  const head = snake[0];
  const angle = Math.atan2(targetPos.y - head.y, targetPos.x - head.x);
  const speed = isFast ? snakeFastSpeed : snakeSpeed; // 가속화 여부에 따른 속도 결정

  // 가속 버튼 상태에 따라 목표 간격 조정
  easeTarget = isFast ? (snakeRadius * 5) / 2.3 : (snakeRadius * 4) / 3;

  // 현재 간격을 목표 간격에 서서히 가깝게 조정
  easeCurrent += (easeTarget - easeCurrent) * easeAmount;

  // 이징 적용된 간격으로 뱀의 세그먼트 간격 결정
  const segmentSpacing = easeCurrent;

  // 뱀 머리 위치 업데이트
  head.x += Math.cos(angle) * speed;
  head.y += Math.sin(angle) * speed;

  // 뱀 몸통 각 세그먼트 이동
  for (let i = snake.length - 1; i > 0; i--) {
    const dx = snake[i - 1].x - snake[i].x;
    const dy = snake[i - 1].y - snake[i].y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const overlap = distance - segmentSpacing; // 겹침 계산
    const moveX = (overlap * dx) / distance;
    const moveY = (overlap * dy) / distance;

    if (overlap > 0) {
      // 세그먼트가 겹치는 경우
      snake[i].x += moveX;
      snake[i].y += moveY;
    }
  }
  // 사과 충돌 체크
  checkAppleCollision();
  // 화면 렌더링
  render();
}

// 장애물 배열 초기화
let obstacles = [];
// 장애물 생성 확률
let obstacleChance = 0.01;
// 최대 장애물 수
let maxObstacles = 10;

// 난이도 설정에서 바꿔주기 위해서 전역으로 빼두는 변수들
let size;
let maxSize = 10;
let minSize = 7;

let speed;
let maxSpeed = 1.0;
let minSpeed = 0.5;

let angle;

// 장애물 생성 함수
function createObstacle() {
  // 장애물 유형을 무작위로 결정 (원, 사각형, 삼각형)
  const type =
    Math.random() < 0.33
      ? "circle"
      : Math.random() < 0.66
      ? "rectangle"
      : "triangle";

  size = Math.random() * (maxSize - minSize) + minSize; // 장애물 크기 무작위 설정 (7 ~ 10)
  angle = Math.random() * Math.PI * 2; // 무작위 이동 방향 설정
  speed = Math.random() * (maxSpeed - minSpeed) + minSpeed; // 장애물 속도 설정 (0.5 ~ 1.0)
  let rotationSpeed = Math.random() * 0.08 - 0.04; // 장애물 회전 속도 설정

  // 장애물 시작 위치 무작위 설정
  const position = {
    x: Math.random() < 0.5 ? -size : canvas.width + size,
    y: Math.random() * canvas.height,
  };
  // 장애물이 캔버스 바깥에서 시작하도록 위치 조정
  if (Math.random() < 0.5) {
    position.x = Math.random() * canvas.width;
    position.y = Math.random() < 0.5 ? -size : canvas.height + size;
  }
  // x, y 방향 속도 계산
  const dx = speed * Math.cos(angle);
  const dy = speed * Math.sin(angle);

  // 장애물 객체를 배열에 추가
  obstacles.push({
    type,
    size,
    x: position.x,
    y: position.y,
    dx,
    dy,
    rotation: 0,
    rotationSpeed,
  });
}

// 장애물 상태 업데이트 함수
function updateObstacles() {
  obstacles.forEach((ob, index) => {
    // 장애물 위치 업데이트
    ob.x += ob.dx;
    ob.y += ob.dy;

    ob.rotation += ob.rotationSpeed; // 장애물 회전

    // 장애물이 캔버스 밖으로 나갔는지 확인
    if (
      ob.x < -ob.size ||
      ob.x > canvas.width + ob.size ||
      ob.y < -ob.size ||
      ob.y > canvas.height + ob.size
    ) {
      obstacles.splice(index, 1); // 캔버스 밖으로 나간 장애물 제거
    }
  });
}

/* 충돌체크 관련 */
// 사과 충돌 체크 함수
function checkAppleCollision() {
  const head = snake[0];
  const distance = Math.sqrt(
    (head.x - applePos.x) ** 2 + (head.y - applePos.y) ** 2
  );
  if (distance < snakeRadius + appleRadius) {
    // 사과 먹었을 때 몸통 추가
    snake.push({ ...snake[snake.length - 1] });
    // 새 사과 위치
    applePos = getRandomPosition();
  }
}

// 벽에 부딪히는지 확인하는 함수
function checkWallCollision() {
  const head = snake[0];
  const margin = 8; // 여유공간을 위한 마진 값
  if (
    head.x < margin ||
    head.x > canvas.width - margin ||
    head.y < margin ||
    head.y > canvas.height - margin
  ) {
    return true;
  }
  return false;
}

// 뱀머리가 장애물에 부딪히는지 확인하는 함수
function checkObstacleCollision() {
  const head = snake[0]; // 뱀의 머리 부분
  for (let ob of obstacles) {
    // 모든 장애물에 대해 반복
    const dx = head.x - ob.x;
    const dy = head.y - ob.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // 뱀의 머리와 장애물 사이의 거리가 충돌을 일으킬만큼 가깝다면
    if (distance < snakeRadius + ob.size) {
      // 게임 오버 처리
      return true; // 충돌 발생
    }
  }
  return false; // 충돌 없음
}

//장애물끼리 충돌체크
function checkObsCollisions() {
  for (let i = 0; i < obstacles.length; i++) {
    for (let j = i + 1; j < obstacles.length; j++) {
      const ob1 = obstacles[i];
      const ob2 = obstacles[j];
      const dx = ob1.x - ob2.x;
      const dy = ob1.y - ob2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < ob1.size + ob2.size) {
        // 간단한 원형 충돌 감지
        // 장애물들의 방향을 반대로 바꿈
        ob1.dx = -ob1.dx;
        ob1.dy = -ob1.dy;
        ob2.dx = -ob2.dx;
        ob2.dy = -ob2.dy;

        // 장애물들이 겹치지 않도록 조금 떨어트림
        const overlap = ob1.size + ob2.size - distance;
        const adjustX = (overlap / 2) * (dx / distance);
        const adjustY = (overlap / 2) * (dy / distance);

        ob1.x += adjustX;
        ob1.y += adjustY;
        ob2.x -= adjustX;
        ob2.y -= adjustY;
      }
    }
  }
}

/* 그리기 관련 함수들 -----------------------------------------*/
// 뱀 그리기 함수
function drawSnake() {
  for (let segment of snake) {
    ctx.beginPath();
    ctx.arc(segment.x, segment.y, snakeRadius, 0, Math.PI * 2);
    ctx.fillStyle = "green";
    ctx.fill();
    ctx.closePath();
  }
}

// 사과 그리기 함수
function drawApple() {
  // 사과 본체 그리기
  ctx.beginPath();
  ctx.arc(applePos.x, applePos.y, appleRadius, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();

  // 줄기 그리기
  ctx.beginPath();
  ctx.rect(applePos.x - 1, applePos.y - appleRadius - 5, 2, 5);
  ctx.fillStyle = "brown";
  ctx.fill();
  ctx.closePath();

  // 사과의 광택을 위한 작은 반짝임
  ctx.beginPath();
  ctx.arc(applePos.x + 3, applePos.y - 3, appleRadius / 8, 0, Math.PI * 2, false);
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.fill();
  ctx.closePath();

  // 잎파리 그리기
  ctx.beginPath();
  ctx.moveTo(applePos.x - 2, applePos.y - appleRadius - 2);
  ctx.lineTo(applePos.x - 10, applePos.y - appleRadius - 10);
  ctx.quadraticCurveTo(applePos.x + 3, applePos.y - appleRadius - 18, applePos.x + 2, applePos.y - appleRadius - 2);
  ctx.fillStyle = "green";
  ctx.fill();
  ctx.closePath();
}




// 장애물 그리기 함수
function drawObstacles() {
  obstacles.forEach((ob) => {
    // 캔버스 상태 저장
    ctx.save();
    // 장애물 중심으로 이동
    ctx.translate(ob.x, ob.y);
    // 장애물 회전
    ctx.rotate(ob.rotation);
    ctx.beginPath();
    if (ob.type === "circle") {
      // 원형 장애물 그리기
      ctx.arc(0, 0, ob.size, 0, Math.PI * 2);
    } else if (ob.type === "rectangle") {
      // 사각형 장애물 그리기
      ctx.rect(-ob.size / 2, -ob.size / 2, ob.size, ob.size);
    } else if (ob.type === "triangle") {
      // 삼각형 장애물 그리기
      ctx.moveTo(0, -ob.size / Math.sqrt(3));
      ctx.lineTo(-ob.size / 2, ob.size / (2 * Math.sqrt(3)));
      ctx.lineTo(ob.size / 2, ob.size / (2 * Math.sqrt(3)));
      ctx.closePath();
    }
    // 장애물 채우기
    ctx.fillStyle = "blue";
    ctx.fill();
    // 캔버스 상태 복원
    ctx.restore();
  });
}

// 화면 렌더링 함수
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // 화면 클리어
  // 뱀 그리기
  drawSnake();
  // 사과 그리기
  drawApple();
  // 장애물 그리기
  drawObstacles();
}

/* 전체적은 게임 시스템 관리 Loop, Over... */
// 게임 루프 함수
function gameLoop() {
  if (gameStarted) {
    const currentTime = Math.floor((Date.now() - startTime) / 1000); // 현재 시간 계산 (게임 시작 이후 경과 시간)

    if (currentTime - lastDifficultyIncrease >= difficultyInterval) {
      // 30초마다 난이도 증가 로직
      increaseDifficulty(); // 난이도 증가 함수 호출
      lastDifficultyIncrease = currentTime; // 마지막 난이도 증가 시간 업데이트
    }

    if (checkObstacleCollision() || checkWallCollision()) {
      // 벽,장애물,몸통 충돌 체크 (머리 기준)
      gameOver(); // 게임 오버 함수 호출
    }
    checkAppleCollision(); // 사과 충돌체크

    checkObsCollisions(); // 장애물끼리의 충돌 체크

    moveSnake(lastMousePos);
    updateStats(); // 상태 업데이트 함수 호출
    // 장애물 생성 조건 변경
    if (Math.random() < obstacleChance && obstacles.length < maxObstacles) {
      // 생성 확률을 1%로 설정
      createObstacle();
    }
    updateObstacles();
    render();

    requestAnimationFrame(gameLoop); // 다음 애니메이션 프레임 요청
  }
}

// 게임 오버 처리
function gameOver() {
  // 게임 오버 후 선택 대화 상자 표시
  if (!gameStarted) {
    return;
  }
  gameStarted = false;

  // 사용자에게 게임 재시작 여부 묻기
  const restart = confirm("게임오버 다시시작할까요?");
  if (restart) {
    // 게임 재시작
    restartGame();
  } else {
    // 타이틀 화면으로 돌아감
    window.location.reload();
  }
}

// 재시작 함수
function restartGame() {
  // 게임 상태 초기화
  let obstacleChance = 0.01;
  // 최대 장애물 수
  let maxObstacles = 10;

  // 난이도 설정 초기화
  maxSize = 10;
  minSize = 7;

  maxSpeed = 1.0;
  minSpeed = 0.5;

  gameStarted = true;
  isFast = false;
  timeElapsed = 0;
  snake = [
    { x: canvas.width / 2, y: canvas.height / 2 },
    { x: canvas.width / 2, y: canvas.height / 2 - (snakeRadius * 2) / 3 },
    { x: canvas.width / 2, y: canvas.height / 2 - (snakeRadius * 4) / 3 },
  ];
  applePos = getRandomPosition();
  obstacles = [];
  lastMousePos = { x: canvas.width / 2, y: canvas.height / 2 };
  startTime = Date.now(); // 게임 시작 시간을 재설정
}
