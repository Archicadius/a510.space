/* editor.js — простой drag-and-drop редактор каталога проектов.
   Активируется через ?edit=1 в URL страницы projects/.

   Логика:
     - Сетка ФИКСИРОВАНА: позиции (с их размерами big/small/medium/xxl)
       никуда не уезжают. Перетаскиваешь — содержимое двух карточек
       (картинка + slug + категория) меняется местами.
     - Одинарный клик ничего не делает.
     - Двойной клик циклит размер карточки: small → medium → big → xxl → small.
       (Нужно только для «хвоста», где сетка ломается.)
     - Кнопка × — удалить карточку из каталога.
     - Снизу панель с экспортом — список slug:size в текущем порядке. */

(function () {
    if (!new URLSearchParams(location.search).has('edit')) return;

    function init() {
        document.body.classList.add('is-editor');

        var grid = document.querySelector('.complex-grid');
        if (!grid) return;
        var SIZES = ['small', 'medium', 'big', 'xxl'];

        var dragging = null;

        function currentSize(card) {
            for (var i = 0; i < SIZES.length; i++) {
                if (card.classList.contains(SIZES[i])) return SIZES[i];
            }
            return 'small';
        }

        function cycleSize(card) {
            var cur = currentSize(card);
            card.classList.remove(cur);
            var nxt = SIZES[(SIZES.indexOf(cur) + 1) % SIZES.length];
            card.classList.add(nxt);
            refresh();
        }

        function getContent(card) {
            var img = card.querySelector('img');
            var cap = card.querySelector('.caption');
            return {
                slug: card.getAttribute('data-slug') || '',
                cat:  card.getAttribute('data-category') || '',
                src:  img ? img.getAttribute('src')   : '',
                alt:  img ? img.getAttribute('alt')   : '',
                ttl:  img ? img.getAttribute('title') : '',
                cap:  cap ? cap.innerHTML : '',
            };
        }
        function setContent(card, c) {
            card.setAttribute('data-slug', c.slug);
            card.setAttribute('data-category', c.cat);
            var img = card.querySelector('img');
            if (img) {
                img.setAttribute('src', c.src);
                img.setAttribute('alt', c.alt);
                img.setAttribute('title', c.ttl);
            }
            var cap = card.querySelector('.caption');
            if (cap) cap.innerHTML = c.cap;
        }
        // Insert: контент исходной карточки переезжает на позицию целевой,
        // все промежуточные карточки сдвигаются на одну позицию.
        function moveContent(src, tgt) {
            if (src === tgt) return;
            var cards = Array.prototype.slice.call(grid.querySelectorAll('a'));
            var si = cards.indexOf(src);
            var ti = cards.indexOf(tgt);
            if (si < 0 || ti < 0) return;
            var data = cards.map(getContent);
            var moving = data.splice(si, 1)[0];
            data.splice(ti, 0, moving);
            for (var i = 0; i < cards.length; i++) setContent(cards[i], data[i]);
        }

        function setupCard(card) {
            card.classList.remove('hidden');
            card.draggable = true;
            var href = card.getAttribute('href') || '';
            if (href && !card.dataset.slug) {
                card.dataset.slug = href.replace(/\.html$/, '');
                card.removeAttribute('href');
            }

            card.addEventListener('dragstart', function (e) {
                dragging = card;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                try { e.dataTransfer.setData('text/plain', ''); } catch (_) {}
            });
            card.addEventListener('dragend', function () {
                card.classList.remove('dragging');
                Array.prototype.forEach.call(
                    grid.querySelectorAll('.drag-target'),
                    function (el) { el.classList.remove('drag-target'); }
                );
                dragging = null;
            });
            card.addEventListener('dragover', function (e) {
                if (!dragging || dragging === card) return;
                e.preventDefault();
                // visual hint
                Array.prototype.forEach.call(
                    grid.querySelectorAll('.drag-target'),
                    function (el) { if (el !== card) el.classList.remove('drag-target'); }
                );
                card.classList.add('drag-target');
            });
            card.addEventListener('dragleave', function () {
                card.classList.remove('drag-target');
            });
            card.addEventListener('drop', function (e) {
                e.preventDefault();
                if (!dragging || dragging === card) return;
                moveContent(dragging, card);
                card.classList.remove('drag-target');
                refresh();
            });

            // Click — ничего не делает (но preventDefault, чтобы случайных переходов не было).
            card.addEventListener('click', function (e) {
                e.preventDefault();
            });
            // Double-click — циклит размер.
            card.addEventListener('dblclick', function (e) {
                e.preventDefault();
                if (e.target.closest('.editor-btn')) return;
                cycleSize(card);
            });

            // Per-card delete button
            var del = document.createElement('button');
            del.className = 'editor-btn editor-del';
            del.type = 'button';
            del.textContent = '×';
            del.title = 'Remove from catalog';
            del.addEventListener('click', function (e) {
                e.preventDefault(); e.stopPropagation();
                if (confirm('Remove this project from the catalog?')) {
                    card.parentNode.removeChild(card);
                    refresh();
                }
            });
            card.appendChild(del);
        }

        var cards = Array.prototype.slice.call(grid.querySelectorAll('a'));
        cards.forEach(setupCard);

        // Floating panel with the export
        var panel = document.createElement('div');
        panel.className = 'editor-panel';
        panel.innerHTML =
            '<h3>Catalog editor</h3>' +
            '<p>Drag a card onto another — it inserts at that position, the rest shift down. ' +
            'Double-click cycles size (small → medium → big → xxl). ' +
            '× removes a card. Grid positions are fixed — sizes stay in place. ' +
            'When done, copy the list and send it to Claude.</p>' +
            '<textarea class="editor-output" readonly></textarea>' +
            '<button type="button" class="editor-copy">Copy</button> ' +
            '<button type="button" class="editor-toggle">Hide panel</button>';
        document.body.appendChild(panel);

        var output = panel.querySelector('.editor-output');
        var copyBtn = panel.querySelector('.editor-copy');
        var toggleBtn = panel.querySelector('.editor-toggle');

        function refresh() {
            var lines = [];
            var anchors = grid.querySelectorAll('a');
            for (var i = 0; i < anchors.length; i++) {
                var a = anchors[i];
                var slug = a.dataset.slug ||
                           (a.getAttribute('href') || '').replace(/\.html$/, '');
                lines.push(slug + ':' + currentSize(a));
            }
            output.value = lines.join('\n');
        }
        refresh();

        copyBtn.addEventListener('click', function () {
            output.select();
            try {
                document.execCommand('copy');
                copyBtn.textContent = 'Copied!';
            } catch (_) {
                copyBtn.textContent = 'Press ⌘C';
            }
            setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1500);
        });

        toggleBtn.addEventListener('click', function () {
            panel.classList.toggle('is-collapsed');
            toggleBtn.textContent = panel.classList.contains('is-collapsed')
                ? 'Show panel' : 'Hide panel';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
