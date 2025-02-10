// ==UserScript==
// @name        X V-Walker
// @namespace        http://tampermonkey.net/
// @version        0.4
// @description        タイムライン上の動画・静止画の暗転拡大表示
// @author        X User
// @match        https://x.com/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
// @updateURL        https://github.com/personwritep/X_V-Walker/raw/main/X_V-Walker.user.js
// @downloadURL        https://github.com/personwritep/X_V-Walker/raw/main/X_V-Walker.user.js
// ==/UserScript==


let disp_mode=0; // 拡張ディスプレイモードのフラグ
let view_w=200; // 🔴拡大率の固定値
let view_c=60; // 🔴コミック拡大率の固定値

let html_=document.documentElement;



document.addEventListener('mousedown', function(event){
    if(disp_mode==0){ // Lightbox非表示
        if(event.ctrlKey){ //「Ctrl+Click」
            event.preventDefault();
            event.stopImmediatePropagation();
            let elem=document.elementFromPoint(event.clientX, event.clientY);
            if(elem){
                let mov_comp=elem.closest('div[data-testid="videoComponent"]');
                if(mov_comp){ // 動画の場合
                    let zb=mov_comp.querySelector('button[aria-label="全画面表示"]');
                    if(zb){
                        zb.click(); }
                    let zbc=mov_comp.querySelector('button[aria-label="全画面表示を終了"]');
                    if(zbc){
                        zbc.click();
                        close_group();
                    }}
                else{ // 静止画の場合
                    box_env();
                    set_img(elem);
                    ex_mag(); }
            }}}
}, true );



function box_env(){

    let lightbox=
        '<div id="lightbox">'+
        '<img id="box_img">'+
        '<style>'+
        '@keyframes fadeIn { 0% {opacity: 0} 100% {opacity: 1}} '+
        '.fin { animation: fadeIn .5s ease 0s 1 normal; animation-fill-mode: both; } '+
        '@keyframes fadeOut { 0% {opacity: 1} 100% {opacity: 0}} '+
        '.fout { animation: fadeOut .2s ease 0s 1 normal; animation-fill-mode: both; } '+
        '#lightbox { position: fixed; top: 0; left: 0; visibility: hidden; z-index: calc(infinity); '+
        'display: grid; place-items: center; overflow: auto; user-select: none; '+
        'background: black; width: 100vw; height: 100vh; text-align: center; } '+
        '#box_img { width: 98vw; height: 98vh; padding: 1vh 1vw; object-fit: contain; '+
        'box-sizing: content-box; max-width: unset; max-height: unset; } '+
        '</style></div>';

    if(!document.querySelector('#lightbox')){
        document.body.insertAdjacentHTML('beforeend', lightbox); }

} // box_env()



function set_img(target){
    let lightbox=document.querySelector('#lightbox');
    let box_img=lightbox.querySelector('#box_img');

    if(lightbox && box_img && target){
        let img_src=target.getAttribute('src');
        if(img_src){
            let link=target.closest('a');
            if(link){
                if(link.hasAttribute('target')){ // 外部リンクの場合
                    disp_mode=1; // Lightbox表示 通常拡大
                    box_img.src=img_src;
                    html_.style.overflow='hidden';
                    lightbox.style.visibility='visible';
                    lightbox.classList.remove('fout');
                    lightbox.classList.add('fin'); }

                else{ // 投稿画像の場合
                    let select=link.getAttribute('href').slice(-1);
                    if(select=='o'){ select='1'; } // header-photo の場合
                    link.click(); // ダイアログ読込み遅延が必要

                    let img_s;
                    let retry=0;
                    let interval=setInterval(wait_target, 10);
                    function wait_target(){
                        retry++;
                        if(retry>100){ // リトライ制限 100回 1secまで
                            clearInterval(interval); }
                        if(select=='1'){
                            img_s=document.querySelector('div[role="dialog"] img'); }
                        else{
                            img_s=document.querySelector('div[role="dialog"] li:nth-child('+ select +') img'); }
                        if(img_s){
                            clearInterval(interval);
                            set_dialog(img_s); }}}}


            function set_dialog(img){
                let now_src=img.getAttribute('src');
                disp_mode=1; // Lightbox表示 通常拡大
                box_img.src=now_src;
                html_.style.overflow='hidden';
                lightbox.style.visibility='visible';
                lightbox.classList.remove('fout');
                lightbox.classList.add('fin'); }

        } // if(img_src)
    } // if(lightbox && box_img && target)

} // set_img()



function ex_mag(){
    let lightbox=document.querySelector('#lightbox');
    let box_img=lightbox.querySelector('#box_img');

    if(lightbox){
        lightbox.onclick=function(event){ // 拡張ディスプレイモード
            event.preventDefault();

            if(!event.ctrlKey && !event.shiftKey){ // 元の表示に戻る
                close_box(); }
            else if(event.shiftKey){
                if(disp_mode==1 || disp_mode==2){
                    disp_mode=3; // コミック拡大
                    lightbox.style.overflow='auto';
                    box_img.style.height='auto';
                    box_img.style.padding='1vh 0';
                    box_img.style.width=view_c +'vw';
                    lightbox.scrollTo(0, 0); }
                else{
                    disp_mode=1; // 通常拡大
                    lightbox.style.overflow='hidden';
                    box_img.style.height='98vh';
                    box_img.style.width='98vw';
                    box_img.style.padding='1vh 1vw'; }}
            else{
                if(disp_mode==1 || disp_mode==3){
                    disp_mode=2; // 拡張拡大
                    lightbox.style.overflow='auto';
                    box_img.style.height='auto';
                    box_img.style.padding='0';
                    box_img.style.width=view_w +'vw';
                    mag_point(event); }
                else{
                    disp_mode=1; // 通常拡大
                    lightbox.style.overflow='hidden';
                    box_img.style.height='98vh';
                    box_img.style.width='98vw';
                    box_img.style.padding='1vh 1vw'; }}


            function mag_point(event){
                let actal_x; // Actual Pixels表示スクロールx値
                let actal_y; // Actual Pixels表示スクロールy値
                let nwidth=box_img.naturalWidth;
                let nhight=box_img.naturalHeight;
                let ratio=nwidth/nhight
                let top=event.offsetY;
                let left=event.offsetX;
                let ww=lightbox.clientWidth;
                let wh=lightbox.clientHeight;

                if(ww<wh*ratio){
                    actal_x=(left*view_w/100) - ww/2;
                    actal_y=(2*top - wh + ww/ratio)*view_w/200 - wh/2; }
                else{
                    let zk=((2*left - ww)/wh/ratio + 1)/2;
                    actal_x=(zk*view_w -50)*ww/100;
                    actal_y=(top*ww*view_w)/(wh*ratio*100) - wh/2; }

                lightbox.scrollTo(actal_x, actal_y); }

        } // onclick()
    }
} // ex_mag()



function close_box(){

    close_group();

    let lightbox=document.querySelector('#lightbox');
    let box_img=lightbox.querySelector('#box_img');
    if(lightbox && box_img){
        disp_mode=0; // 拡張ディスプレイモード リセット
        html_.style.overflow='inherit';
        lightbox.classList.remove('fin');
        lightbox.classList.add('fout');
        lightbox.style.overflow='hidden'; // overflowのリセット
        box_img.style.height='98vh';
        box_img.style.width='98vw';
        box_img.style.padding='1vh 1vw';
        setTimeout(()=>{
            lightbox.style.visibility='hidden';
            box_img.src='';
        }, 200); }}



function close_group(){
    let close_sw=document.querySelector('#layers div[role="presentation"]');
    if(close_sw){
        close_sw.click(); }}



let c_press;

function key_press(event){
    c_press=event.ctrlKey; } // Ctrlキー押下の true false を取得

document.addEventListener("keyup", key_press, {passive: false});
document.addEventListener("keydown", key_press, {passive: false});

function weel_idle(event){
    if(c_press && disp_mode>0){ // ブラウザ拡縮の操作を抑止
        event.preventDefault(); }}

window.addEventListener("mousewheel", weel_idle, {passive: false});
window.addEventListener("wheel", weel_idle, {passive: false});
