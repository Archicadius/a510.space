/* site.js — небольшие интерактивные элементы поверх статики.
   Сейчас: карусель планов на страницах проектов.
   Способы перелистывания:
     - стрелки prev / next по бокам
     - тач-свайп (нативный, через scroll-snap, без JS)
     - мышь: тянуть картинку
     - мышь: короткий клик в левую/правую половину = prev/next
*/

(function () {
    var CLICK_THRESHOLD_PX = 5;  // ниже этого порога — считаем кликом, не drag-ом

    function initCarousel(plans) {
        var track = plans.querySelector('.plans-track');
        var prev = plans.querySelector('.plans-nav.prev');
        var next = plans.querySelector('.plans-nav.next');
        var counter = plans.querySelector('.plans-counter');
        if (!track) return;
        var slides = track.children;
        var n = slides.length;
        if (n < 2) return;

        function current() {
            return Math.round(track.scrollLeft / track.clientWidth);
        }
        function update() {
            var i = current();
            if (prev) prev.disabled = (i <= 0);
            if (next) next.disabled = (i >= n - 1);
            if (counter) counter.textContent = (i + 1) + ' / ' + n;
        }
        function go(delta) {
            var i = current() + delta;
            i = Math.max(0, Math.min(n - 1, i));
            track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
        }

        if (prev) prev.addEventListener('click', function (e) { e.preventDefault(); go(-1); });
        if (next) next.addEventListener('click', function (e) { e.preventDefault(); go(1); });
        track.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();

        // === Mouse drag + click on track (desktop only) ===
        // Touch — нативный scroll-snap, мы его не трогаем.
        var isDragging = false;
        var startX = 0;
        var startScrollLeft = 0;
        var maxMoved = 0;
        var pointerType = '';

        track.addEventListener('pointerdown', function (e) {
            if (e.pointerType !== 'mouse') return; // touch handled natively
            isDragging = true;
            pointerType = e.pointerType;
            startX = e.clientX;
            startScrollLeft = track.scrollLeft;
            maxMoved = 0;
            track.style.scrollSnapType = 'none';
            track.classList.add('is-dragging');
            try { track.setPointerCapture(e.pointerId); } catch (_) {}
        });

        track.addEventListener('pointermove', function (e) {
            if (!isDragging) return;
            var dx = e.clientX - startX;
            var ady = Math.abs(dx);
            if (ady > maxMoved) maxMoved = ady;
            track.scrollLeft = startScrollLeft - dx;
            if (ady > CLICK_THRESHOLD_PX) e.preventDefault();
        });

        function endDrag(e) {
            if (!isDragging) return;
            isDragging = false;
            track.classList.remove('is-dragging');
            track.style.scrollSnapType = '';

            if (maxMoved < CLICK_THRESHOLD_PX) {
                // Treat as click: which half?
                var rect = track.getBoundingClientRect();
                var x = (e && e.clientX) ? (e.clientX - rect.left) : rect.width / 2;
                go(x < rect.width / 2 ? -1 : 1);
            } else {
                // Drag → snap to nearest slide
                var i = Math.round(track.scrollLeft / track.clientWidth);
                track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
            }
            try { track.releasePointerCapture(e.pointerId); } catch (_) {}
        }

        track.addEventListener('pointerup', endDrag);
        track.addEventListener('pointercancel', endDrag);
        track.addEventListener('pointerleave', function (e) {
            if (isDragging && e.pointerType === 'mouse') endDrag(e);
        });

        // Картинки внутри track — иначе браузер пытается их перетащить как файл
        var imgs = track.querySelectorAll('img');
        for (var i = 0; i < imgs.length; i++) {
            imgs[i].setAttribute('draggable', 'false');
        }
    }

    function init() {
        var carousels = document.querySelectorAll('.plans.is-carousel');
        for (var i = 0; i < carousels.length; i++) initCarousel(carousels[i]);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
