# Window Buttons Extension

This is an extension for Gnome 3.38 (should work for GNOME 40 too) that fixes a bug in some apps not sending the proper characters and just sending the xml escape sequence on notifactions. (For example transforming &amp;#39; into ')

## Installation

The only way to install for now is manually through git.

```bash
git clone https://github.com/PWall2222/XMLFix.git
cd XMLFix
mkdir -p ~/.local/share/gnome-shell/extensions
cp xmlfix@pwall.github.com ~/.local/share/gnome-shell/extensions/
gnome-extensions enable xmlfix@pwall.github.com
```
