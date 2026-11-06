<script setup>
import { onMounted } from 'vue'
//網路上神人的作品 https://codepen.io/spicyvickywang/pen/ByoBRwO
onMounted(() => {
    const stackContainer = document.querySelector('.stack-container'); //卡片容器
    const cardNodes = document.querySelectorAll('.card-container'); // 所有卡片容器
    const perspecNodes = document.querySelectorAll('.perspec');  // 選擇所有的透視元素
    const perspec = document.querySelector('.perspec'); // 只選擇第一個透視元素
    const card = document.querySelector('.card'); // 卡片數量計數器
    //測試
    console.log('perspec 元素:', perspec);
    console.log('perspecNodes 元素:', perspecNodes);

    let counter = stackContainer.children.length;

    //動畫執行流程：
    //第一階段：Tilt 動畫完成後觸發 Explode
    card.addEventListener('animationend', function () {
        //測試
        console.log('card 動畫完成，開始 explode');
        perspecNodes.forEach(function (elem, index) {
            elem.classList.add('explode'); // 為所有透視元素添加爆炸動畫
        });
    });

    //第二階段：Explode 動畫完成後的處理
    perspec.addEventListener('animationend', function (e) {
        //測試
        console.log('perspec 動畫完成，動畫名稱:', e.animationName);
        if (e.animationName.startsWith('explode')) {
            // 只有第一個 perspec 完成 explode 動畫時才會執行
            cardNodes.forEach(function (elem, index) {

                ////注意問題： 只監聽第一個 .perspec 的動畫結束事件！

                // 為每張卡片執行以下操作:
                //// 1. 添加懸停效果：
                elem.classList.add('pokeup');

                //// 2.滑鼠點擊滑掉卡片的動畫(監聽click事件)
                elem.addEventListener('click', function () {
                    console.log('點擊事件發生');
                    let updown = [800, -800]
                    let randomY = updown[Math.floor(Math.random() * updown.length)];
                    let randomX = Math.floor(Math.random() * 1000) - 1000;
                    elem.style.transform = `translate(${randomX}px, ${randomY}px) rotate(-540deg)`
                    elem.style.transition = "transform 1s ease, opacity 2s";
                    elem.style.opacity = "0";
                    counter--;
                    if (counter === 0) {
                        stackContainer.style.width = "0";
                        stackContainer.style.height = "0";
                    }
                });
            });
        }
    });
})
</script>

<template>
<div class="container">
        <div class="error">
            <h1>404</h1>
            <br>
            <h2>error</h2>
            <p>可能是路由設定有問題，或是這個頁面還沒有建立，記得再檢查router.js</p>
            <p>點擊右邊頁面會有動畫</p>
            <button>
                <span><RouterLink :to="{name:'home'}" class="text-reset text-decoration-none" title="首頁">回首頁</RouterLink></span>
            </button>
            
        </div>
        <div class="stack-container"> <!-- 卡片堆疊容器 -->
            <div class="card-container"> <!-- 單張卡片容器 -->
                <div class="perspec" style="--spreaddist: 125px; --scaledist: .75; --vertdist: -25px;">
                    <div class="card">
                        <div class="writing"> <!-- 模擬程式碼編輯器 -->
                            <div class="topbar">
                                <div class="red"></div>  <!-- 紅色按鈕 -->
                                <div class="yellow"></div> <!-- 黃色按鈕 -->
                                <div class="green"></div> <!-- 綠色按鈕 -->
                            </div>
                            <div class="code">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 重複 6 次 ↓↓↓ ，每次有不同的 CSS 變數值 -->
            <div class="card-container">
                <div class="perspec" style="--spreaddist: 100px; --scaledist: .8; --vertdist: -20px;">
                    <div class="card">
                        <div class="writing">
                            <div class="topbar">
                                <div class="red"></div>
                                <div class="yellow"></div>
                                <div class="green"></div>
                            </div>
                            <div class="code">
                                <ul>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-container">
                <div class="perspec" style="--spreaddist:75px; --scaledist: .85; --vertdist: -15px;">
                    <div class="card">
                        <div class="writing">
                            <div class="topbar">
                                <div class="red"></div>
                                <div class="yellow"></div>
                                <div class="green"></div>
                            </div>
                            <div class="code">
                                <ul>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-container">
                <div class="perspec" style="--spreaddist: 50px; --scaledist: .9; --vertdist: -10px;">
                    <div class="card">
                        <div class="writing">
                            <div class="topbar">
                                <div class="red"></div>
                                <div class="yellow"></div>
                                <div class="green"></div>
                            </div>
                            <div class="code">
                                <ul>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-container">
                <div class="perspec" style="--spreaddist: 25px; --scaledist: .95; --vertdist: -5px;">
                    <div class="card">
                        <div class="writing">
                            <div class="topbar">
                                <div class="red"></div>
                                <div class="yellow"></div>
                                <div class="green"></div>
                            </div>
                            <div class="code">
                                <ul>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-container">
                <div class="perspec" style="--spreaddist: 0px; --scaledist: 1; --vertdist: 0px;">
                    <div class="card">
                        <div class="writing">
                            <div class="topbar">
                                <div class="red"></div>
                                <div class="yellow"></div>
                                <div class="green"></div>
                            </div>
                            <div class="code">
                                <ul>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<style lang="css" scoped>
/* CSS 變數說明：
--spreaddist: 爆炸時的散開距離
--scaledist: 爆炸時的縮放比例
--vertdist: 爆炸時的垂直位移 */
body,
html {
    padding: 0;
    margin: 0;
    font-family: 'Quicksand', sans-serif;
    font-weight: 400;
    overflow: hidden;
}

h1{
    color: #92559c;
}
h2{
    color: #92559c;
}

.writing {
    width: 320px;
    height: 200px;
    background-color: #92559c;
    border: 1px solid #f6f6f6;
    border-radius: 6px 6px 4px 4px;
    position: relative;
}

.writing .topbar{
    position: absolute;
    width: 100%;
    height: 12px;
    background-color: #f6f6f6;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
}

.writing .topbar div{
    height: 6px;
    width: 6px;
    border-radius: 50%;
    margin: 3px;
    float: left;
}

.writing .topbar div.green{
    background-color: #60d060;
}
.writing .topbar div.red{
    background-color: red;
}
.writing .topbar div.yellow{
    background-color: #e6c015;
}

.writing .code {
    padding: 15px;
}

.writing .code ul {
    list-style: none;
    margin: 0;
    padding: 0;
}


.container {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
        -ms-flex-align: center;
            align-items: center;
    -webkit-box-pack: center;
        -ms-flex-pack: center;
            justify-content: center;
    height: 100vh;
    width: 100%;
    -webkit-transition: -webkit-transform .5s;
    transition: -webkit-transform .5s;
    transition: transform .5s;
    transition: transform .5s, -webkit-transform .5s;
}

.stack-container {
    position: relative;
    width: 420px;
    height: 210px;
    -webkit-transition: width 1s, height 1s;
    transition: width 1s, height 1s;
}

.pokeup {
    -webkit-transition: all .3s ease;
    transition: all .3s ease;
}

.pokeup:hover {
    -webkit-transform: translateY(-10px);
            transform: translateY(-10px);
    -webkit-transition: .3s ease;
    transition: .3s ease;
}


.error {
    width: 400px;
    padding: 40px;
    text-align: center;
}

.error h1 {
    font-size: 125px;
    padding: 0;
    margin: 0;
    font-weight: 700;
}

.error h2 {
    margin: -30px 0 0 0;
    padding: 0px;
    font-size: 47px;
    letter-spacing: 12px;
}

.perspec {
    -webkit-perspective: 1000px;
            perspective: 1000px;
}


.explode{
    -webkit-animation: explode .5s ease-in-out forwards;
            animation: explode .5s ease-in-out forwards;
}

.card {
    -webkit-animation: tiltcard .5s ease-in-out 1s forwards;
            animation: tiltcard .5s ease-in-out 1s forwards;
    position: absolute;
}

@-webkit-keyframes tiltcard {
    0% {
        -webkit-transform: rotateY(0deg);
                transform: rotateY(0deg);
    }

    100% {
        -webkit-transform: rotateY(-30deg);
                transform: rotateY(-30deg);
    }
}

@keyframes tiltcard {
    0% {
        -webkit-transform: rotateY(0deg);
                transform: rotateY(0deg);
    }

    100% {
        -webkit-transform: rotateY(-30deg);
                transform: rotateY(-30deg);
    }
}

@-webkit-keyframes explode {
    0% {
        -webkit-transform: translate(0, 0) scale(1);
                transform: translate(0, 0) scale(1);
    }

    100% {
        -webkit-transform: translate(var(--spreaddist), var(--vertdist)) scale(var(--scaledist));
                transform: translate(var(--spreaddist), var(--vertdist)) scale(var(--scaledist));
    }
}

@keyframes explode {
    0% {
        -webkit-transform: translate(0, 0) scale(1);
                transform: translate(0, 0) scale(1);
    }

    100% {
        -webkit-transform: translate(var(--spreaddist), var(--vertdist)) scale(var(--scaledist));
                transform: translate(var(--spreaddist), var(--vertdist)) scale(var(--scaledist));
    }
}

@media screen and (max-width: 1000px) {
    .container {
      -webkit-transform: scale(.85);
              transform: scale(.85);
    }
  }

  @media screen and (max-width: 850px) {
    .container {
      -webkit-transform: scale(.75);
              transform: scale(.75);
    }
  }

  @media screen and (max-width: 775px) {
    .container {
      -ms-flex-wrap: wrap-reverse;
          flex-wrap: wrap-reverse;
      -webkit-box-align: inherit;
          -ms-flex-align: inherit;
              align-items: inherit;
    }
  }

  @media screen and (max-width: 370px) {
    .container {
        -webkit-transform: scale(.6);
                transform: scale(.6);
      }
  }
  
  /* 回首頁按鈕的css */
  /* From Uiverse.io by mrhyddenn */ 
button {
  background: #fff;
  border: 1px solid #92559c;
  color: #92559c;
  padding: 10px 20px;
  display: inline-block;
  font-size: 15px;
  font-weight: 600;
  width: 120px;
  text-transform: uppercase;
  cursor: pointer;
  transform: skew(-21deg);
}

span {
  display: inline-block;
  transform: skew(21deg);
}

button::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  right: 100%;
  left: 0;
  background:#92559c;
  opacity: 0;
  z-index: -1;
  transition: all 0.5s;
}

button:hover {
  color: #f6f6f6;
}

button:hover::before {
  left: 0;
  right: 0;
  opacity: 1;
}
</style>