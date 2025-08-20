# YAML Parser - Advanced YAML Editor with Anchors & References

A powerful React-based YAML editor application that provides visual editing capabilities with full support for YAML anchors (&) and references (*), including specialized support for web service mocks management.

## Features

### Core Functionality
- **Visual YAML Editor**: Interactive UI for editing YAML configurations without writing raw YAML
- **Anchors & References**: Full support for YAML anchors and references with visual management
- **Mock Service Management**: Dedicated editor for web service mocks with HTTP status codes and responses
- **Real-time YAML Generation**: Live preview of generated YAML output as you edit
- **File Import/Export**: Load existing YAML/JSON files and export edited configurations
- **Anchor Manager**: Visual overview of all defined anchors and active references with path tooltips

### Key Components

#### 1. UI YAML Editor
- Visual form-based editing of YAML structures
- Automatic anchor/reference detection and management
- Support for complex nested structures
- Toggle metadata visibility
- Independent reference selection for data and mocks

#### 2. WebService Mocks Editor
- Dedicated interface for managing API mock responses
- Support for multiple web services
- HTTP status code configuration
- Response payload editing
- Mock-to-mock references with "Mock:" prefix in UI

#### 3. Anchor & Reference Editor
- Side-by-side YAML editing with anchor visualization
- Real-time anchor and reference tracking
- Scope document generation
- Path tooltips for long paths (hover to see full path)

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd yaml-parser
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

## Usage Guide

### Basic Workflow

1. **Starting with Sample Data**: The application loads with sample configuration data by default, demonstrating anchors and references.

2. **Loading Your Own Files**:
   - Click "Load YAML/JSON" button in any editor
   - Select your .yaml, .yml, or .json file
   - The editor will parse and display your configuration

3. **Creating Anchors**:
   - Navigate to any object in the visual editor
   - Click the anchor icon (⚓)
   - Enter a unique anchor name
   - The anchor will be created and available for referencing

4. **Creating References**:
   - Navigate to any object that should reference an anchor
   - Click the link icon (🔗)
   - Select from available anchors in the dropdown
   - Mock anchors will show with "Mock:" prefix for clarity

5. **Editing Mock Services**:
   - Switch to "WebService Mocks Editor" tab
   - Add/edit web services and their mock responses
   - Configure HTTP status codes and response payloads
   - Create anchors for reusable mock responses

6. **Exporting YAML**:
   - Click "Copy YAML" to copy to clipboard
   - Click "Download" to save as a file
   - The generated YAML maintains all anchors and references

### Advanced Features

#### Mock References in UI YAML Editor
- Mock anchors from web services appear with "Mock:" prefix
- Selection maintains proper YAML reference format (without prefix)
- Enables cross-referencing between data and mock configurations

#### Tooltip System
- Long paths in Anchor Manager show tooltips on hover
- Instant tooltip appearance for better UX
- Prevents path truncation issues in complex configurations

#### Metadata Toggle
- Show/Hide metadata (anchors and references) in visual editor
- Useful for focusing on data or structure

## Project Structure

```
yaml-parser/
├── src/
│   ├── components/
│   │   ├── UIYamlEditor.tsx          # Main visual YAML editor
│   │   ├── VisualEditor.tsx          # Recursive visual element renderer
│   │   ├── WebServiceMocksEditor.tsx # Mock services management
│   │   ├── YamlEditor.tsx            # Raw YAML editor with anchors
│   │   ├── AnchorManager.tsx         # Anchor/reference overview panel
│   │   └── ErrorBoundary.tsx         # Error handling wrapper
│   ├── context/
│   │   └── DataContext.tsx           # Global state management
│   ├── custom-yaml-parser/
│   │   ├── yaml-parser.ts            # YAML parsing with metadata
│   │   └── yaml-generator.ts         # YAML generation with anchors
│   ├── utils/
│   │   └── yaml-utils.ts             # YAML manipulation utilities
│   ├── types/
│   │   └── yaml-editor.types.ts      # TypeScript type definitions
│   ├── App.tsx                       # Main application component
│   └── main.tsx                      # Application entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Format code with Prettier
npm run format

# Type checking
npm run typecheck
```

## Technology Stack

- **React 19.1**: UI framework with latest features
- **TypeScript**: Type safety and better DX
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **js-yaml**: YAML parsing and generation
- **Lucide React**: Icon components

## Key Implementation Details

### Anchor/Reference System
- Anchors are stored as metadata within objects using `anchor` property
- References use `referenceOf` property pointing to anchor names
- The system maintains referential integrity when editing

### State Management
- Uses React Context API for global state
- Separate state for data and mocks
- Real-time synchronization between visual editor and YAML output

### Mock Prefix Display
- UI shows "Mock:" prefix for mock anchors
- Actual YAML values don't include the prefix
- Helps users distinguish between data and mock references

### Performance Optimizations
- CSS-based tooltips for instant display
- Memoized callbacks to prevent unnecessary re-renders
- Efficient deep cloning for state updates

## Common Use Cases

1. **API Configuration Management**: Define base configurations with anchors and override specific environments using references

2. **Mock Service Testing**: Create reusable mock responses for API testing with proper status codes

3. **Configuration Templates**: Build template configurations that can be referenced and extended

4. **Multi-Environment Setup**: Use anchors for common settings across development, staging, and production

## Troubleshooting

### Issue: References not sticking when selected
**Solution**: Ensure the anchor exists in either data or mocks. The system now uses `allAnchors` combining both sources.

### Issue: Mock references not showing
**Solution**: Mock anchors are prefixed with "Mock:" in the UI but not in the actual YAML value.

### Issue: Long paths cut off in Anchor Manager
**Solution**: Hover over truncated paths to see the full path in a tooltip.

### Issue: File upload not working
**Solution**: Ensure file is valid YAML (.yaml, .yml) or JSON (.json) format.

## Development Notes

- Run `npm install` to install dependencies
- Vite serves at http://localhost:5173 by default
- ESLint and Prettier are configured for code quality
- TypeScript provides type safety throughout the application

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `npm run lint` and `npm run typecheck`
6. Submit a pull request

## License

[Add your license information here]

## Support

For issues, questions, or suggestions, please open an issue on the repository.

---

Built with ❤️ for developers who need powerful YAML configuration management.
