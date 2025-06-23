// ==UserScript==
// @name        X V-Walker
// @namespace        http://tampermonkey.net/
// @version        0.8
// @description        タイムライン上の動画・静止画の暗転拡大表示
// @author        X User
// @match        https://x.com/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
// @updateURL        https://github.com/personwritep/X_V-Walker/raw/main/X_V-Walker.user.js
// @downloadURL        https://github.com/personwritep/X_V-Walker/raw/main/X_V-Walker.user.js
// ==/UserScript==


let disp_mode=0; // 拡張ディスプレイモードのフラグ   OFF:0  ON:1  Graphic:2  Comic:3
let graphic_w; // Graphic拡大の拡大率
let comic_w; // Comic拡大の拡大率
let zmode; // 拡大モードのバックアップ Graphic_w: 2  Comic: 3

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
                        close_group(); }}

                else{ // 静止画の場合
                    box_env0();
                    box_env1();
                    help();
                    set_img(elem);
                    ex_mag(); }}

        }} // if(disp_mode==0)

}, true );



document.addEventListener('keydown', function(event){
    if(event.keyCode=='27'){ //「ESC」キーの押下
        if(disp_mode>0){
            event.preventDefault();
            close_box(); }}
}, true );



function box_env0(){

    let ud_SVG=
        '<svg height="23" width="23" viewBox="0 0 40 50">'+
        '<path style="fill: currentColor;" d="M20 6L13 21L28 21C25.9 15.9 23.5 '+
        '10.3 20 6M13 28L20 43C23.5 38.7 25.9 33.1 28 28L13 28z"></path>'+
        '</svg>';

    let lightbox=
        '<div id="lightbox">'+
        '<div id="photo_sw">'+
        '<div id="ws" title="拡大率：マウスホイールで調節">'+
        '<span id="wsv"></span>'+ ud_SVG +'</div>'+
        '<div id="lbox_help">？</div>'+
        '</div>'+
        '<img id="box_img">'+
        '<style>'+
        '@keyframes fadeIn { 0% {opacity: 0} 100% {opacity: 1}} '+
        '.fin { animation: fadeIn .5s ease 0s 1 normal; animation-fill-mode: both; } '+
        '@keyframes fadeOut { 0% {opacity: 1} 100% {opacity: 0}} '+
        '.fout { animation: fadeOut .2s ease 0s 1 normal; animation-fill-mode: both; } '+

        '#lightbox { position: fixed; top: 0; left: 0; z-index: calc(infinity); visibility: hidden; '+
        'background: black; width: 100vw; height: 100vh; text-align: center; '+
        'overflow: auto; } '+
        '#box_img { width: 98vw; height: 98vh; padding: 1vh 1vw; object-fit: contain; '+
        'box-sizing: content-box; max-width: unset; max-height: unset; margin: 0px auto;} '+
        '#photo_sw { position: fixed; width: 100%; height: 10%; user-select: none; } '+
        '#lbox_help { position: absolute; top: 25px; right: 32px; width: 27px; height: 27px; '+
        'margin: 0; font: bold 21px/27px Meiryo; color: #fff; background: #000; '+
        'border: 2px solid #fff; border-radius: 30px; cursor: pointer; opacity: 0; } '+
        '#photo_sw:hover #lbox_help { opacity: 1; } '+
        '#ws { position: absolute; top: 24px; right: 70px; display: flex; height: 24px; '+
        'box-sizing: content-box; padding: 0 2px 0 12px; font: bold 22px/27px Meiryo; '+
        'color: #fff; background: #000; border: 2px solid #fff; border-radius: 4px; '+
        'opacity: 0; visibility: hidden; } '+
        '#photo_sw:hover #ws { opacity: 1; } '+
        '#ws svg { margin-top: 1px; } '+
        '</style></div>';

    if(!document.querySelector('#lightbox')){
        document.body.insertAdjacentHTML('beforeend', lightbox); }

} // box_env()



function box_env1(){
    comic_w=localStorage.getItem('Lightbox_comic_w');
    if(isNaN(comic_w) || comic_w<20 || comic_w>90){
        comic_w=60; }
    localStorage.setItem('Lightbox_comic_w', comic_w); // Storage更新

    graphic_w=localStorage.getItem('Lightbox_graphic_w');
    if(!graphic_w || isNaN(graphic_w) || graphic_w<20 || graphic_w>400){
        graphic_w=200; }
    localStorage.setItem('Lightbox_graphic_w', graphic_w); // Storage更新

    zmode=localStorage.getItem('Lightbox_zmode');
    if(zmode!=2 && zmode!=3){
        zmode=2; }
    localStorage.setItem('Lightbox_zmode', zmode); // Storage更新

} // box_env1()



function help(){
    let lbox_help=document.querySelector('#lbox_help');
    if(lbox_help){
        lbox_help.onclick=function(event){
            event.stopImmediatePropagation();
            window.open('https://ameblo.jp/personwritep/entry-12883321073.html',
                        null, 'width=820,height=800'); }}}



function zoom_set(){
    let photo_sw=document.querySelector('#photo_sw');
    let ws=document.querySelector('#ws');
    let wsv=document.querySelector('#wsv');


    function ac_check(element){
        let opa=window.getComputedStyle(element).getPropertyValue('opacity');
        if(opa=='1'){
            return true; }}


    if(photo_sw && ws && wsv){
        if(disp_mode==2){
            wsv.textContent='Gz '+ graphic_w; }
        else if(disp_mode==3){
            wsv.textContent='Cz '+ comic_w; }


        photo_sw.onwheel=function(event){ // マスウホイールで設定
            if(disp_mode==2){ // Graphic拡大
                if(event.deltaY<0 && ac_check(ws) && graphic_w<381){
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    graphic_w=graphic_w*1 +20;
                    let box_img=document.querySelector('#box_img');
                    if(box_img){
                        box_img.style.width=graphic_w +'vw';
                        trim(); }
                    wsv.textContent='Gz '+ graphic_w;
                    localStorage.setItem('Lightbox_graphic_w', graphic_w); } // Storage更新

                else if(event.deltaY>0 && ac_check(ws) && graphic_w>139){
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    graphic_w=graphic_w*1 -20;
                    let box_img=document.querySelector('#box_img');
                    if(box_img){
                        box_img.style.width=graphic_w +'vw';
                        trim(); }
                    wsv.textContent='Gz '+ graphic_w;
                    localStorage.setItem('Lightbox_graphic_w', graphic_w); }} // Storage更新

            else if(disp_mode==3){ // Comic拡大
                if(event.deltaY<0 && ac_check(ws) && comic_w<81){
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    comic_w=comic_w*1 +10;
                    let box_img=document.querySelector('#box_img');
                    if(box_img){
                        box_img.style.width=comic_w +'vw';
                        trim(); }
                    wsv.textContent='Cz '+ comic_w;
                    localStorage.setItem('Lightbox_comic_w', comic_w); } // Storage更新

                else if(event.deltaY>0 && ac_check(ws) && comic_w>29){
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    comic_w=comic_w*1 -10;
                    let box_img=document.querySelector('#box_img');
                    if(box_img){
                        box_img.style.width=comic_w +'vw';
                        trim(); }
                    wsv.textContent='Cz '+ comic_w;
                    localStorage.setItem('Lightbox_comic_w', comic_w); }}} // Storage更新

    } // if(photo_sw && ws && wsv)

} // zoom_set()



function trim(){
    let lightbox=document.querySelector('#lightbox');
    let box_img=document.querySelector('#box_img');
    let i_width=box_img.naturalWidth;
    let i_height=box_img.naturalHeight;
    let w_width= window.innerWidth;
    let w_height= window.innerHeight;
    let view_w;

    if(disp_mode==2){ // Graphic拡大
        view_w=w_width*graphic_w/100;
        lightbox.scrollTo((view_w - w_width)/2, ((view_w*i_height)/i_width - w_height)/2); }
    else if(disp_mode==3){ // Comic拡大
        lightbox.scrollTo(0, 0); }}



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
                    let img_id=img_src.split('?')[0];
                    if(link.href.includes('header_photo')){
                        img_id=img_id.replace('/600x200', ''); } // ヘッダー画像の場合


                    link.click(); // ダイアログ読込み遅延が必要

                    let img_s;
                    let retry=0;
                    let interval=setInterval(wait_target, 10);
                    function wait_target(){
                        retry++;
                        if(retry>100){ // リトライ制限 100回 1secまで
                            clearInterval(interval); }
                        if(width_check()){
                            img_s=document.querySelector('[role="dialog"] img[src^="'+ img_id +'"]'); }
                        else{
                            img_s=document.querySelector('main img[src^="'+ img_id +'"]'); }
                        if(img_s){
                            clearInterval(interval);
                            set_dialog(img_s); }}


                    function width_check(){
                        if(document.querySelector('.r-16xksha')){ // 幅720px以上でmainに設定される
                            return true; }
                        else{
                            return false; }}

                }} // if(link)


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
    let ws=document.querySelector('#ws');

    if(lightbox){
        lightbox.onclick=function(event){ // 拡張ディスプレイモード
            event.preventDefault();

            if(!event.ctrlKey && !event.shiftKey){ // 元の表示に戻る
                ws.style.visibility='hidden';
                close_box(); }

            else if(event.shiftKey){ //「Ctrl+Shift」または「Shift」の押下
                if(disp_mode==1){
                    if(zmode==2){
                        ex_mag3(event); }
                    else if(zmode==3){
                        ex_mag2(event); }}
                else if(disp_mode==2){
                    ex_mag3(event); }
                else if(disp_mode==3){
                    ex_mag2(event); }}

            else if(event.ctrlKey){ //「Ctrl」の押下
                if(disp_mode==1){
                    if(zmode==2){
                        ex_mag2(event); }
                    else if(zmode==3){
                        ex_mag3(event); }}
                else if(disp_mode==2 || disp_mode==3){
                    ex_mag1(event); }}


            function ex_mag1(event){
                disp_mode=1; // 通常拡大
                lightbox.style.overflow='hidden';
                box_img.style.height='98vh';
                box_img.style.width='98vw';
                box_img.style.padding='1vh 1vw';
                ws.style.visibility='hidden'; }


            function ex_mag2(event){
                disp_mode=2; // Graphic拡大
                zmode=2;
                localStorage.setItem('Lightbox_zmode', zmode); // Storage更新
                lightbox.style.overflow='auto';
                box_img.style.height='auto';
                box_img.style.padding='0';
                box_img.style.width=graphic_w +'vw';
                mag_point(event);
                ws.style.visibility='visible';
                zoom_set(); }


            function ex_mag3(event){
                disp_mode=3; // Comic拡大
                zmode=3;
                localStorage.setItem('Lightbox_zmode', zmode); // Storage更新
                lightbox.style.overflow='auto';
                box_img.style.height='auto';
                box_img.style.padding='1vh 0';
                box_img.style.width=comic_w +'vw';
                lightbox.scrollTo(0, 0);
                ws.style.visibility='visible';
                zoom_set(); }



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
                    actal_x=(left*graphic_w/100) - ww/2;
                    actal_y=(2*top - wh + ww/ratio)*graphic_w/200 - wh/2; }
                else{
                    let zk=((2*left - ww)/wh/ratio + 1)/2;
                    actal_x=(zk*graphic_w -50)*ww/100;
                    actal_y=(top*ww*graphic_w)/(wh*ratio*100) - wh/2; }

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
    let close_sw=document.querySelector('[role="presentation"] button[aria-label="閉じる"]');
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
