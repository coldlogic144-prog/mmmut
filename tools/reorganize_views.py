# tools/reorganize_views.py

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract chessClubView block
chess_start = html.find('    <!-- ============================================================ -->\n    <!-- CHESS CLUB VIEW')
if chess_start == -1:
    chess_start = html.find('    <div id="chessClubView">')

modal_start = html.find('    <!-- ============================================================ -->\n    <!-- MODALS & OVERLAYS')

chess_and_tg_block = html[chess_start:modal_start]

# Remove the block from its current location
html_without_block = html[:chess_start] + html[modal_start:]

# Find where </main> ends before <footer class="app-foot">
main_end_pos = html_without_block.find('                </main>') + len('                </main>')

# Insert chess and telegram right after </main>
new_html = (
    html_without_block[:main_end_pos]
    + '\n\n'
    + chess_and_tg_block.strip()
    + '\n'
    + html_without_block[main_end_pos:]
)

with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print('Successfully moved chessClubView and telegramView inside .app-main')
