<script lang="ts">
  import { PaintBucket, Type as TypeIcon, Layout } from 'lucide-svelte';
  import SearchBar from './SearchBar.svelte';
  import { fade } from 'svelte/transition';
  import { settingsStore, type AppSettings, type Theme, type Font, type WordWrap, type Position } from '../stores/settingsStore';

  type SectionId = keyof AppSettings;

  interface BaseSettingMetadata {
    label: string;
  }

  interface SelectSettingMetadata<T> extends BaseSettingMetadata {
    type: 'select';
    options: Array<{ value: T; label: string }>;
  }

  interface NumberSettingMetadata extends BaseSettingMetadata {
    type: 'number';
    min: number;
    max: number;
  }

  interface BooleanSettingMetadata extends BaseSettingMetadata {
    type: 'boolean';
  }

  type AppearanceSettingId = keyof AppSettings['appearance'];
  type EditorSettingId = keyof AppSettings['editor'];
  type LayoutSettingId = keyof AppSettings['layout'];

  type SettingMetadata = SelectSettingMetadata<Theme | Font | WordWrap | Position> | NumberSettingMetadata | BooleanSettingMetadata;

  interface AppearanceSetting {
    id: AppearanceSettingId;
    metadata: SettingMetadata;
  }

  interface EditorSetting {
    id: EditorSettingId;
    metadata: SettingMetadata;
  }

  interface LayoutSetting {
    id: LayoutSettingId;
    metadata: SettingMetadata;
  }

  interface AppearanceSection {
    id: 'appearance';
    label: string;
    icon: any;
    settings: AppearanceSetting[];
  }

  interface EditorSection {
    id: 'editor';
    label: string;
    icon: any;
    settings: EditorSetting[];
  }

  interface LayoutSection {
    id: 'layout';
    label: string;
    icon: any;
    settings: LayoutSetting[];
  }

  type AppSection = AppearanceSection | EditorSection | LayoutSection;
  type AppSetting = AppearanceSetting | EditorSetting | LayoutSetting;

  let activeSection: keyof AppSettings = 'appearance';
  let searchQuery = '';

  const sections: AppSection[] = [
    {
      id: 'appearance',
      label: 'Appearance',
      icon: PaintBucket,
      settings: [
        {
          id: 'theme',
          metadata: {
            label: 'Color Theme',
            type: 'select',
            options: [
              { value: 'dark' as Theme, label: 'Dark (Default)' },
              { value: 'darker' as Theme, label: 'Darker' },
              { value: 'light' as Theme, label: 'Light' },
              { value: 'system' as Theme, label: 'System' }
            ]
          }
        },
        {
          id: 'font',
          metadata: {
            label: 'Font Family',
            type: 'select',
            options: [
              { value: 'system' as Font, label: 'System Default' },
              { value: 'fira' as Font, label: 'Fira Code' },
              { value: 'jetbrains' as Font, label: 'JetBrains Mono' },
              { value: 'cascadia' as Font, label: 'Cascadia Code' }
            ]
          }
        },
        {
          id: 'fontSize',
          metadata: {
            label: 'Font Size',
            type: 'number',
            min: 8,
            max: 32
          }
        }
      ]
    },
    {
      id: 'editor',
      label: 'Editor',
      icon: TypeIcon,
      settings: [
        {
          id: 'tabSize',
          metadata: {
            label: 'Tab Size',
            type: 'number',
            min: 1,
            max: 8
          }
        },
        {
          id: 'insertSpaces',
          metadata: {
            label: 'Insert Spaces',
            type: 'boolean'
          }
        },
        {
          id: 'wordWrap',
          metadata: {
            label: 'Word Wrap',
            type: 'select',
            options: [
              { value: 'off' as WordWrap, label: 'Off' },
              { value: 'on' as WordWrap, label: 'On' },
              { value: 'wordWrapColumn' as WordWrap, label: 'Wrap at Column' }
            ]
          }
        }
      ]
    },
    {
      id: 'layout',
      label: 'Layout',
      icon: Layout,
      settings: [
        {
          id: 'sidebarPosition',
          metadata: {
            label: 'Sidebar Position',
            type: 'select',
            options: [
              { value: 'left' as Position, label: 'Left' },
              { value: 'right' as Position, label: 'Right' }
            ]
          }
        },
        {
          id: 'panelPosition',
          metadata: {
            label: 'Panel Position',
            type: 'select',
            options: [
              { value: 'bottom' as Position, label: 'Bottom' },
              { value: 'right' as Position, label: 'Right' }
            ]
          }
        }
      ]
    }
  ];

  function handleSearch(event: CustomEvent<string>) {
    searchQuery = event.detail;
  }

  function isAppearanceSection(section: AppSection): section is AppearanceSection {
    return section.id === 'appearance';
  }

  function isEditorSection(section: AppSection): section is EditorSection {
    return section.id === 'editor';
  }

  function isLayoutSection(section: AppSection): section is LayoutSection {
    return section.id === 'layout';
  }

  function getSettingValue(section: AppSection, setting: AppSetting): string | number | boolean {
    if (isAppearanceSection(section)) {
      return $settingsStore.appearance[setting.id as keyof AppSettings['appearance']];
    }
    if (isEditorSection(section)) {
      return $settingsStore.editor[setting.id as keyof AppSettings['editor']];
    }
    if (isLayoutSection(section)) {
      return $settingsStore.layout[setting.id as keyof AppSettings['layout']];
    }
    throw new Error('Invalid section or setting');
  }

  function getSettingOptions(setting: AppSetting) {
    if (setting.metadata.type === 'select') {
      return setting.metadata.options;
    }
    return [];
  }

  function getSettingMinMax(setting: AppSetting): { min: number; max: number } | undefined {
    if (setting.metadata.type === 'number') {
      return {
        min: setting.metadata.min,
        max: setting.metadata.max
      };
    }
    return undefined;
  }

  function handleSettingEvent(
    section: AppSection,
    setting: AppSetting,
    event: Event
  ): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const metadata = setting.metadata;

    if (isAppearanceSection(section)) {
      const appearanceSetting = setting as AppearanceSetting;
      if (appearanceSetting.id === 'fontSize' && metadata.type === 'number') {
        const num = parseInt(target.value);
        if (!isNaN(num) && num >= metadata.min && num <= metadata.max) {
          settingsStore.updateSetting('appearance', appearanceSetting.id, num);
        }
      } else if (appearanceSetting.id === 'theme' && metadata.type === 'select') {
        settingsStore.updateSetting('appearance', appearanceSetting.id, target.value as Theme);
      } else if (appearanceSetting.id === 'font' && metadata.type === 'select') {
        settingsStore.updateSetting('appearance', appearanceSetting.id, target.value as Font);
      }
    } else if (isEditorSection(section)) {
      const editorSetting = setting as EditorSetting;
      if (editorSetting.id === 'tabSize' && metadata.type === 'number') {
        const num = parseInt(target.value);
        if (!isNaN(num) && num >= metadata.min && num <= metadata.max) {
          settingsStore.updateSetting('editor', editorSetting.id, num);
        }
      } else if (editorSetting.id === 'insertSpaces' && metadata.type === 'boolean') {
        settingsStore.updateSetting('editor', editorSetting.id, (target as HTMLInputElement).checked);
      } else if (editorSetting.id === 'wordWrap' && metadata.type === 'select') {
        settingsStore.updateSetting('editor', editorSetting.id, target.value as WordWrap);
      }
    } else if (isLayoutSection(section)) {
      const layoutSetting = setting as LayoutSetting;
      if (metadata.type === 'select') {
        settingsStore.updateSetting('layout', layoutSetting.id, target.value as Position);
      }
    }
  }

  function filterSection<T extends AppSection>(section: T): T {
    return {
      ...section,
      settings: section.settings.filter(setting => 
        setting.metadata.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    };
  }

  function getFilteredSections() {
    return sections.map(section => filterSection(section)).filter(section => section.settings.length > 0);
  }
  
  $: filteredSections = getFilteredSections();
  $: activeFilteredSection = filteredSections.find(section => section.id === activeSection);
</script>

<div class="settings-panel">
  <div class="settings-header">
    <div class="search-container">
      <SearchBar on:search={handleSearch} placeholder="Search settings..." />
    </div>
  </div>

  <div class="settings-content">
    <div class="settings-sidebar">
      {#each filteredSections as section (section.id)}
        <div
          class="sidebar-item"
          class:active={activeSection === section.id}
          on:click={() => activeSection = section.id}
        >
          <svelte:component this={section.icon} size={16} />
          <span>{section.label}</span>
        </div>
      {/each}
    </div>

    <div class="settings-main" transition:fade>
      {#if activeFilteredSection}
        <div class="settings-section">
          <h2>{activeFilteredSection.label}</h2>
          {#each activeFilteredSection.settings as setting (setting.id)}
            <div class="setting-item">
              <div class="setting-label">
                <label for={setting.id}>{setting.metadata.label}</label>
              </div>
              <div class="setting-control">
                {#if setting.metadata.type === 'select'}
                  <select
                    id={setting.id}
                    value={getSettingValue(activeFilteredSection, setting)}
                    on:change={(e) => handleSettingEvent(activeFilteredSection, setting, e)}
                  >
                    {#each getSettingOptions(setting) as option}
                      <option value={option.value}>{option.label}</option>
                    {/each}
                  </select>
                {:else if setting.metadata.type === 'number'}
                  {#if setting.metadata.min !== undefined && setting.metadata.max !== undefined}
                    <input
                      type="number"
                      id={setting.id}
                      value={getSettingValue(activeFilteredSection, setting)}
                      min={setting.metadata.min}
                      max={setting.metadata.max}
                      on:change={(e) => handleSettingEvent(activeFilteredSection, setting, e)}
                    />
                  {/if}
                {:else if setting.metadata.type === 'boolean'}
                  <label class="toggle">
                    <input
                      type="checkbox"
                      id={setting.id}
                      checked={Boolean(getSettingValue(activeFilteredSection, setting))}
                      on:change={(e) => handleSettingEvent(activeFilteredSection, setting, e)}
                    />
                    <span class="toggle-slider"></span>
                  </label>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .settings-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--warp-bg-panel);
    color: var(--warp-text-primary);
  }

  .settings-header {
    padding: var(--warp-space-md);
    border-bottom: 1px solid var(--warp-border);
  }

  .search-container {
    width: 100%;
  }

  .settings-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .settings-sidebar {
    width: 200px;
    border-right: 1px solid var(--warp-border);
    background-color: var(--warp-bg-main);
    overflow-y: auto;
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    gap: var(--warp-space-sm);
    padding: var(--warp-space-sm) var(--warp-space-md);
    color: var(--warp-text-secondary);
    cursor: pointer;
    transition: all var(--warp-transition-normal);
  }

  .sidebar-item:hover {
    color: var(--warp-text-primary);
    background-color: var(--warp-hover);
  }

  .sidebar-item.active {
    color: var(--warp-accent);
    background-color: var(--warp-bg-panel);
  }

  .settings-main {
    flex: 1;
    padding: var(--warp-space-md);
    overflow-y: auto;
  }

  .settings-section {
    margin-bottom: var(--warp-space-xl);
  }

  .settings-section h2 {
    font-size: 16px;
    font-weight: 500;
    margin: 0 0 var(--warp-space-lg);
    color: var(--warp-text-primary);
  }

  .setting-item {
    display: flex;
    align-items: center;
    padding: var(--warp-space-md);
    border-radius: 4px;
    transition: background-color var(--warp-transition-normal);
  }

  .setting-item:hover {
    background-color: var(--warp-hover);
  }

  .setting-label {
    flex: 1;
  }

  .setting-label label {
    font-size: 13px;
    color: var(--warp-text-primary);
  }

  .setting-control {
    width: 200px;
  }

  select, input[type="number"] {
    width: 100%;
    height: 28px;
    padding: 0 var(--warp-space-sm);
    background-color: var(--warp-bg-main);
    border: 1px solid var(--warp-border);
    border-radius: 4px;
    color: var(--warp-text-primary);
    font-size: 13px;
    transition: all var(--warp-transition-normal);
  }

  select:hover, input[type="number"]:hover {
    border-color: var(--warp-border-light);
  }

  select:focus, input[type="number"]:focus {
    border-color: var(--warp-accent);
    outline: none;
  }

  .toggle {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--warp-bg-main);
    border: 1px solid var(--warp-border);
    transition: all var(--warp-transition-normal);
    border-radius: 20px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 2px;
    bottom: 2px;
    background-color: var(--warp-text-secondary);
    transition: all var(--warp-transition-normal);
    border-radius: 50%;
  }

  input:checked + .toggle-slider {
    background-color: var(--warp-accent-transparent);
    border-color: var(--warp-accent);
  }

  input:checked + .toggle-slider:before {
    transform: translateX(20px);
    background-color: var(--warp-accent);
  }
</style>
