# Challenge YAML Generator

A static web application that provides an intuitive interface to generate `challenge.yml` files for Campfire Security challenges. Hosted on GitHub Pages.

## Features

- **Web-based Form Interface**: Easy-to-use form with all challenge.yml fields
- **Dynamic Instance Management**: Add multiple instances with DNS entries and flags
- **YAML Preview**: Preview the generated YAML before downloading
- **Client-side Processing**: All processing happens in your browser - no server required
- **GitHub Pages Ready**: Automatically deployed when you push to the repository

## Usage

### Online (GitHub Pages)

Simply visit the GitHub Pages URL for this repository:
```
https://[your-username].github.io/challange-yml-generator/
```

### Local Testing

Since this is a static site, you can test it locally in several ways:

#### Option 1: Direct File Opening (Simplest)
Simply double-click `index.html` or open it directly in your browser:
```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

**Note:** Some browsers may have CORS restrictions when opening files directly. If you encounter issues, use one of the server options below.

#### Option 2: Python HTTP Server (Recommended)
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Or use the provided test script
./test-local.sh
```
Then open `http://localhost:8000` in your browser.

#### Option 3: Node.js (if you have Node installed)
```bash
npx serve .
# or
npx http-server
```
Then open the URL shown in the terminal (usually `http://localhost:3000`).

#### Option 4: VS Code Live Server
If you use VS Code, install the "Live Server" extension and right-click `index.html` → "Open with Live Server"

## Form Fields

### Basic Information
- **Challenge Name**: The overall name of the challenge
- **Category**: Select from predefined categories (prefixes added automatically)
- **Challenge Tag**: Repository name format (no spaces, use - or _)
- **Static**: Enable build pipeline (checkbox)

### Challenge Description (OD)
- Multi-line text area supporting Markdown format
- Include prerequisites, outcomes, and solution steps

### Instances
Each instance can have:
- **Docker Image**: Image reference (auto-prefixed with `ghcr.io/campfire-security/` for non-static)
- **DNS Entries**: One or more DNS entries with name (A records only)
- **Flags**: One or more flags with:
  - Tag (unique identifier)
  - Name (display name)
  - Static flag value
  - Points (awarded for capture, default: 20)
  - Category (dropdown selection)
  - Description (Markdown supported)

## Category Prefixes

The following category prefixes are automatically applied to tags:

| Category | Prefix |
|----------|--------|
| Starters | `st_` |
| Forensics | `fr_` |
| Web exploitation | `we_` |
| Cryptography | `cry_` |
| Boot 2 Root | `b2r_` |
| Reverse Engineering | `re_` |
| Binary (PWN) | `bn_` |
| Misc | `mi_` |
| Operational Technologies | `ot_` |

## GitHub Pages Setup

1. Go to your repository settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select the branch (usually `main` or `master`)
4. Select the root folder (`/`)
5. Click "Save"
6. Your site will be available at `https://[your-username].github.io/challange-yml-generator/`

## Project Structure

```
.
├── index.html          # Main HTML file
├── static/
│   ├── style.css      # Styling (dark theme with orange accents)
│   └── script.js      # Client-side YAML generation logic
├── challenge.yml       # Example/template file
├── .nojekyll          # Disable Jekyll processing
└── test-local.sh      # Quick local test script
```

## How It Works

- All YAML generation happens client-side using the [js-yaml](https://github.com/nodeca/js-yaml) library
- No backend server required - everything runs in your browser
- Form validation ensures data integrity before generation
- Preview functionality lets you review the YAML before downloading

## License

This project is part of the Campfire Security challenge development tools.
