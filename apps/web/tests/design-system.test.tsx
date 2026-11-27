import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const tokens = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')
import {
  Badge,
  Button,
  Card,
  Heading,
  IconButton,
  Label,
  Modal,
  Popover,
  Separator,
  Skeleton,
  Slider,
  Spinner,
  Surface,
  Text,
  Toggle,
  Tooltip,
  VisuallyHidden,
} from '@infinite-radio/design-system'

describe('design tokens', () => {
  it('centralizes the core color tokens', () => {
    for (const name of [
      '--color-background',
      '--color-surface',
      '--color-surface-elevated',
      '--color-text-primary',
      '--color-text-secondary',
      '--color-text-muted',
      '--color-accent',
      '--color-accent-hover',
      '--color-success',
      '--color-border',
      '--color-overlay',
    ]) {
      expect(tokens).toContain(name)
    }
  })

  it('defines station accent tokens', () => {
    expect(tokens).toContain('--color-station-weightless')
    expect(tokens).toContain('--color-station-blue-notes')
    expect(tokens).toContain('--color-station-after-hours')
  })

  it('defines motion tokens', () => {
    for (const name of [
      '--duration-fast',
      '--duration-normal',
      '--duration-slow',
      '--duration-atmospheric',
    ]) {
      expect(tokens).toContain(name)
    }
  })
})

describe('Button', () => {
  it('renders children and handles clicks', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Listen</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Listen' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('supports variants and disabled state', () => {
    render(
      <Button variant="destructive" disabled>
        Remove
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Remove' })
    expect(button).toBeDisabled()
    expect(button.className).toContain('text-danger')
  })

  it('never wraps its label and stretches when fullWidth', () => {
    render(<Button fullWidth>Save changes</Button>)
    const button = screen.getByRole('button', { name: 'Save changes' })
    expect(button.className).toContain('whitespace-nowrap')
    expect(button.className).toContain('w-full')
  })
})

describe('IconButton', () => {
  it('exposes an accessible label and pressed state', () => {
    render(<IconButton label="Favorite" icon={<span aria-hidden>*</span>} active />)
    const button = screen.getByRole('button', { name: 'Favorite' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Typography primitives', () => {
  it('Heading renders the requested level with display styling', () => {
    render(<Heading level={1}>Stations</Heading>)
    const heading = screen.getByRole('heading', { level: 1, name: 'Stations' })
    expect(heading.className).toContain('font-sans')
  })

  it('Text applies size and color variants', () => {
    render(
      <Text variant="small" color="muted">
        metadata
      </Text>,
    )
    const text = screen.getByText('metadata')
    expect(text.className).toContain('text-small')
    expect(text.className).toContain('text-text-muted')
  })

  it('Label renders an associated label element', () => {
    render(<Label htmlFor="field">Volume</Label>)
    expect(document.querySelector('label')).toHaveAttribute('for', 'field')
  })
})

describe('Badge', () => {
  it('renders content', () => {
    render(<Badge tone="accent">Ambient</Badge>)
    expect(screen.getByText('Ambient')).toBeInTheDocument()
  })
})

describe('Slider', () => {
  it('shows the current value and emits changes', () => {
    const onChange = vi.fn()
    render(
      <Slider label="Texture density" value={40} min={0} max={100} onChange={onChange} />,
    )
    const slider = screen.getByRole('slider', { name: 'Texture density' })
    expect(slider).toHaveValue('40')
    expect(screen.getByText('40')).toBeInTheDocument()
    fireEvent.change(slider, { target: { value: '65' } })
    expect(onChange).toHaveBeenCalledWith(65)
  })

  it('respects disabled state', () => {
    render(<Slider label="Depth" value={10} onChange={() => {}} disabled />)
    expect(screen.getByRole('slider', { name: 'Depth' })).toBeDisabled()
  })
})

describe('Toggle', () => {
  it('behaves as a switch', () => {
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} label="Reduced motion" />)
    const toggle = screen.getByRole('switch', { name: 'Reduced motion' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

describe('Overlay primitives', () => {
  it('Modal renders a dialog and closes on Escape', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} label="Settings">
        <p>Settings content</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('Modal renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={() => {}} label="Settings">
        content
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Modal always renders a close button', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} label="Settings">
        content
      </Modal>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('Popover opens and closes via trigger and Escape', () => {
    render(
      <Popover trigger={<button type="button">Open</button>}>
        <p>Panel content</p>
      </Popover>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByText('Panel content')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('Panel content')).not.toBeInTheDocument()
  })

  it('Tooltip exposes content for hover and focus', () => {
    render(
      <Tooltip content="Play">
        <button type="button">trigger</button>
      </Tooltip>,
    )
    expect(screen.getByRole('tooltip')).toHaveTextContent('Play')
  })
})

describe('Layout primitives', () => {
  it('Surface and Card render containers', () => {
    render(
      <Surface data-testid="surface">
        <Card data-testid="card">inside</Card>
      </Surface>,
    )
    expect(screen.getByTestId('surface')).toBeInTheDocument()
    expect(screen.getByTestId('card')).toHaveTextContent('inside')
  })

  it('Separator exposes orientation semantics', () => {
    render(<Separator orientation="vertical" />)
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')
  })
})

describe('Feedback primitives', () => {
  it('Skeleton renders a placeholder region', () => {
    render(<Skeleton data-testid="skeleton" />)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('Spinner exposes a status role when labeled', () => {
    render(<Spinner label="Loading" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('VisuallyHidden keeps content in the tree', () => {
    render(
      <button type="button">
        <VisuallyHidden>Screen reader only</VisuallyHidden>*
      </button>,
    )
    expect(screen.getByRole('button', { name: /screen reader only/i })).toBeInTheDocument()
  })
})
