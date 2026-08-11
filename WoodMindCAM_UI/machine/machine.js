/* =========================================================
WoodMind CAM - Machine UI
Phase 2.1
========================================================= */

(function () {
    const WM = window.WoodMind;
    const state = WM.AppState;

    const $ = (id) => document.getElementById(id);

    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.tab-panel');

    function renderAll() {
        renderMode();
        renderMachineList();
        renderGeneral();
        renderATCTable();
        renderDrillTable();
        renderCode();
        renderPreviewXML();
        updateButtons();
    }

    WM.renderAll = renderAll;

    function renderMode() {
        const label = $('modeLabel');
        if (!label) return;

        if (state.mode === WM.MODE.VIEW) label.textContent = 'View Mode';
        if (state.mode === WM.MODE.NEW) label.textContent = 'New Machine';
        if (state.mode === WM.MODE.EDIT) label.textContent = 'Edit Mode';

    }

    function renderMachineList() {
        const list = $('machineList');
        if (!list) return;

        list.innerHTML = '';

        if (!state.machineList.length) {
            const empty = document.createElement('div');
            empty.className = 'machine-item';
            empty.innerHTML = '<div class="machine-name">No machine</div><div class="machine-meta">Create your first machine</div>';
            list.appendChild(empty);
            return;
        }

        state.machineList.forEach((m) => {
            const item = document.createElement('div');
            item.className = 'machine-item' + (m.id === state.selectedId ? ' active' : '');
            item.innerHTML = '<div class="machine-name">' + (m.name || 'Unnamed') + '</div><div class="machine-meta">ID ' + m.id + '</div>';
            item.addEventListener('click', () => {
                if (state.mode !== WM.MODE.VIEW) return;

                WM.selectMachine(m.id);

                renderAll();
            });
            list.appendChild(item);
        });

    }

    function bindInput(id, path) {
        const el = $(id);
        if (!el) return;

        el.value = path.get();

        const update = () => {
            path.set(el.type === 'checkbox' ? el.checked : el.value);
            WM.markDirty();
            renderPreviewXML();
        };

        el.addEventListener('input', update);
        el.addEventListener('change', update);

    }

    function renderGeneral() {
        const m = state.currentMachine;
        if (!m) return;

        bindInput('machineName', {
            get: () => m.name,
            set: (v) => (m.name = v)
        });

        bindInput('manufacturer', {
            get: () => m.manufacturer,
            set: (v) => (m.manufacturer = v)
        });

        bindInput('controller', {
            get: () => m.controller,
            set: (v) => (m.controller = v)
        });

        bindInput('units', {
            get: () => m.units,
            set: (v) => (m.units = v)
        });

        bindInput('feedUnit', {
            get: () => m.feed_unit,
            set: (v) => (m.feed_unit = v)
        });

        const img = $('machineImage');
        if (img) img.src = m.image || '../assets/default_machine.png';

    }

    function createCellInput(value, onChange) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value ?? '';
        input.addEventListener('input', (e) => {
            onChange(e.target.value);
            WM.markDirty();
            renderPreviewXML();
        });
        return input;
    }

    function createCellSelect(value, options, onChange) {
        const select = document.createElement('select');

        options.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt;
            o.textContent = opt;
            if (opt === value) o.selected = true;
            select.appendChild(o);
        });

        select.addEventListener('change', e => {
            onChange(e.target.value);
            WM.markDirty();
            renderPreviewXML();
        });

        return select;
    }

    function renderATCTable() {
        const tbody = document.querySelector('#atcTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const m = state.currentMachine;
        if (!m) return;

        $('atcEnable').checked = !!m.atc.enable;

        m.atc.tools.forEach((tool, index) => {
            const tr = document.createElement('tr');

            const cols = [
                ['num', tool.num],
                ['name', tool.name],
                ['type', tool.type],
                ['dia', tool.dia],
                ['length', tool.length],
                ['spindle_speed', tool.spindle_speed],
                ['feed_rate', tool.feed_rate],
                ['plunge_rate', tool.plunge_rate]
            ];

            cols.forEach(([key, value]) => {
                const td = document.createElement('td');

                if (key === 'type') {
                    td.appendChild(
                        createCellSelect(
                            value,
                            [
                                'EndMill',
                                'BallEndMill',
                                'VBit',
                                'Drill',
                                'Compression',
                                'Surfacing',
                                'SlotCutter',
                                'Custom'
                            ],
                            (v) => {
                                tool.type = v;
                            }
                        )
                    );
                } else {
                    td.appendChild(
                        createCellInput(value, (v) => {
                            tool[key] = isNaN(v) || key === 'name' ? v : Number(v);
                        })
                    );
                }

                tr.appendChild(td);
            });

            tr.addEventListener('click', () => {
                tbody.querySelectorAll('tr').forEach((r) => r.classList.remove('selected'));
                tr.classList.add('selected');
                tbody.dataset.selected = String(index);
            });

            tbody.appendChild(tr);
        });

        $('atcToolChange').value = m.atc.tool_change || '';

    }

    function renderDrillTable() {
        const tbody = document.querySelector('#drillTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const m = state.currentMachine;
        if (!m) return;

        $('drillEnable').checked = !!m.drill.enable;

        m.drill.tools.forEach((tool, index) => {
            const tr = document.createElement('tr');

            const cols = [
                ['num', tool.num],
                ['name', tool.name],
                ['dia', tool.dia],
                ['plunge_rate', tool.plunge_rate]
            ];

            cols.forEach(([key, value]) => {
                const td = document.createElement('td');
                td.appendChild(
                    createCellInput(value, (v) => {
                        tool[key] = isNaN(v) || key === 'name' ? v : Number(v);
                    })
                );
                tr.appendChild(td);
            });

            tr.addEventListener('click', () => {
                tbody.querySelectorAll('tr').forEach((r) => r.classList.remove('selected'));
                tr.classList.add('selected');
                tbody.dataset.selected = String(index);
            });

            tbody.appendChild(tr);
        });

        $('drillOn').value = m.drill.drill_on || '';
        $('drillOff').value = m.drill.drill_off || '';
        $('drillToolChange').value = m.drill.tool_change || '';

    }

    function renderCode() {
        const m = state.currentMachine;
        if (!m) return;

        $('startupCode').value = m.startup_code || '';
        $('shutdownCode').value = m.shutdown_code || '';

    }

    function xmlText(text) {
        return (text || '').replace(/\\\\n/g, '\n');
    }

    function renderPreviewXML() {
        const pre = $('xmlPreview');
        const m = state.currentMachine;
        if (!pre || !m) return;

        const lines = [];
        lines.push('<Machine>');
        lines.push('  <SchemaVersion>' + (m.schema_version || 1) + '</SchemaVersion>');
        lines.push('  <Id>' + (m.id || 0) + '</Id>');
        lines.push('  <Name>' + (m.name || '') + '</Name>');
        lines.push('  <Manufacturer>' + (m.manufacturer || '') + '</Manufacturer>');
        lines.push('  <Controller>' + (m.controller || '') + '</Controller>');
        lines.push('  <Units>' + (m.units || 'MM') + '</Units>');
        lines.push('  <FeedUnit>' + (m.feed_unit || 'MM_MIN') + '</FeedUnit>');
        lines.push('  <Image>' + (m.image || '../assets/default_machine.png') + '</Image>');
        lines.push('  <StartupCode><![CDATA[');
        lines.push(xmlText(m.startup_code));
        lines.push(']]></StartupCode>');
        lines.push('  <ATCGroup>');
        lines.push('    <Enable>' + (m.atc.enable ? 1 : 0) + '</Enable>');
        lines.push('    <ToolChange><![CDATA[');
        lines.push(xmlText(m.atc.tool_change));
        lines.push(']]></ToolChange>');
        lines.push('  </ATCGroup>');
        lines.push('  <DrillGroup>');
        lines.push('    <Enable>' + (m.drill.enable ? 1 : 0) + '</Enable>');
        lines.push('    <DrillON><![CDATA[');
        lines.push(xmlText(m.drill.drill_on));
        lines.push(']]></DrillON>');
        lines.push('    <DrillOFF><![CDATA[');
        lines.push(xmlText(m.drill.drill_off));
        lines.push(']]></DrillOFF>');
        lines.push('    <ToolChange><![CDATA[');
        lines.push(xmlText(m.drill.tool_change));
        lines.push(']]></ToolChange>');
        lines.push('  </DrillGroup>');
        lines.push('  <ShutdownCode><![CDATA[');
        lines.push(xmlText(m.shutdown_code));
        lines.push(']]></ShutdownCode>');
        lines.push('</Machine>');

        pre.textContent = lines.join('\\n');

    }

    function updateButtons() {
        const view = state.mode === WM.MODE.VIEW;

        const list = $('machineList');

        if (list) {
            list.classList.toggle('disabled', !view);
        }

        $('btnNew').disabled = !view;
        $('btnEdit').disabled = !view || !state.selectedId;
        $('btnDelete').disabled = !view || !state.selectedId;

        $('btnApply').disabled = view;

        $('btnOK').textContent = view ? 'Close' : 'OK';
    }

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const name = tab.dataset.tab;
            tabs.forEach((t) => t.classList.remove('active'));
            panels.forEach((p) => p.classList.remove('active'));
            tab.classList.add('active');
            $('tab-' + name).classList.add('active');
            WM.setCurrentTab(name);
        });
    });

    $('btnNew').addEventListener('click', () => {
        if (!confirmDiscard()) return;

        WM.enterNewMode();

        renderAll();
    });

    $('btnEdit').addEventListener('click', () => {
        if (!confirmDiscard()) return;

        WM.enterEditMode();

        renderAll();
    });

    $('btnDelete').addEventListener('click', () => {
        if (!state.selectedId) return;
        if (confirm('Delete selected machine?')) {
            alert('Phase 2.3: machine_delete request will be sent to Ruby/C#');
        }
    });

    $('btnAddATC').addEventListener('click', () => {
        state.currentMachine.atc.tools.push({
            num: state.currentMachine.atc.tools.length + 1,
            name: '',
            type: 'EndMill',
            dia: 0,
            length: 0,
            spindle_speed: 18000,
            feed_rate: 8000,
            plunge_rate: 3000
        });
        WM.markDirty();
        renderATCTable();
        renderPreviewXML();
    });

    $('btnDeleteATC').addEventListener('click', () => {
        const tbody = document.querySelector('#atcTable tbody');
        const index = Number(tbody.dataset.selected);
        if (Number.isInteger(index)) {
            state.currentMachine.atc.tools.splice(index, 1);
            delete tbody.dataset.selected;
            WM.markDirty();
            renderATCTable();
            renderPreviewXML();
        }
    });

    $('btnAddDrill').addEventListener('click', () => {
        state.currentMachine.drill.tools.push({
            num: 21 + state.currentMachine.drill.tools.length,
            name: '',
            dia: 0,
            plunge_rate: 3000
        });
        WM.markDirty();
        renderDrillTable();
        renderPreviewXML();
    });

    $('btnDeleteDrill').addEventListener('click', () => {
        const tbody = document.querySelector('#drillTable tbody');
        const index = Number(tbody.dataset.selected);
        if (Number.isInteger(index)) {
            state.currentMachine.drill.tools.splice(index, 1);
            delete tbody.dataset.selected;
            WM.markDirty();
            renderDrillTable();
            renderPreviewXML();
        }
    });

    $('btnCancel').addEventListener('click', () => {
        if (state.mode === WM.MODE.VIEW) {
            window.close();
            return;
        }
        WM.cancelEditing();
        renderAll();
    });

    $('btnApply').addEventListener('click', () => {
        if (state.mode === WM.MODE.NEW) {
            alert('Phase 2.2: machine_create request will be sent to Ruby/C#');
        } else if (state.mode === WM.MODE.EDIT) {
            alert('Phase 2.3: machine_update request will be sent to Ruby/C#');
        }
    });

    $('btnOK').addEventListener('click', () => {
        if (state.mode === WM.MODE.VIEW) {
            window.close();
            return;
        }
        if (state.mode === WM.MODE.NEW) {
            alert('Phase 2.2: machine_create request will be sent to Ruby/C#');
        } else if (state.mode === WM.MODE.EDIT) {
            alert('Phase 2.3: machine_update request will be sent to Ruby/C#');
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        if (window.sketchup && window.sketchup.ruby_ready) {
            window.sketchup.ruby_ready();
        } else {
            // chạy trực tiếp trên Chrome/GitHub Pages
            window.WoodMind.initializeForBrowser();
            window.WoodMind.renderAll();
        }
    });

    function confirmDiscard() {
        if (state.mode === WM.MODE.VIEW) return true;

        if (!state.dirty) return true;

        return confirm('You have unsaved changes. Discard current changes?');
    }
})();


