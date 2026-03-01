# Mobile Test Findings (375px viewport)

## Dashboard Issues Found
1. Header: search bar, corretores, bell, importar, criar formulário all visible - too crowded
2. Sidebar (PASTAS) still visible on mobile - should be hidden or collapsible
3. Cards grid doesn't stack to single column properly
4. Filter tabs (Todos, Publicados, etc.) overflow horizontally
5. "Última atualização" button gets cut off

## Key Issues to Fix
- Dashboard header needs mobile-first redesign: hide search behind icon, collapse actions into menu
- Sidebar needs to be hidden on mobile with toggle
- Cards grid needs to be single column on mobile
- Filter tabs need horizontal scroll on mobile
