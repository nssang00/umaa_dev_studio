# Studio shell layout (2026-11-05)

## Major regions

| Region | Initial width/height | Interaction |
| --- | --- | --- |
| Explorer (left) | 274px | Drag the right separator; arrow keys adjust by 16px |
| Main Workbench (center) | Remaining viewport width; minimum 360px | Stretches as the side panes resize |
| Properties (right) | 292px | Drag the left separator; arrow keys adjust by 16px |
| Output / Console (under center) | Collapsed 42px, expanded 210px | Up caret expands, down caret collapses; selecting a tab opens |

Explorer permitted width: 210–480px. Properties permitted width: 240–540px. Widths are clamped when the browser shrinks. Side-pane widths are persisted in browser localStorage (`umaa.studio.pane-widths.v1`) separately from the project/domain model. Neither domain data nor editor selection changes when panels are resized.

The bottom panel remains text-only for diagnostics and local UI events. It is **not** a DDS runtime console. The console is under the main workbench, not spanning the Explorer or Properties columns. The two resize separators expose accessibility labels, ARIA values and keyboard Home/End/Arrow controls.

## Module boundaries

- `StudioShell.jsx`: layout and pane resizing only; receives pane content through props.
- `studioLayout.js`: pure sizing constraints and layout math, independently testable.
- `BottomPanel.jsx`: tabs, static validation output, local UI log and caret collapse.
- `App.jsx`: composes feature modules and passes content into the shell.

## Acceptance checks

- Drag either vertical separator without modifying the other pane's width.
- Maintain at least the configured 360px central workbench width in the supported minimum 900px viewport.
- Save and restore pane widths across reload; handle corrupt/unavailable localStorage safely.
- Toggle Console using up/down carets; Output/Console tabs and logs still work.
- `npm test` (including `test:studio-layout`) and `npm run build` succeed on GitHub Actions.
