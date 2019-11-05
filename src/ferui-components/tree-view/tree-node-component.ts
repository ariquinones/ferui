import { Component, Input, OnInit, Output, EventEmitter, TemplateRef, HostBinding } from '@angular/core';
import {
  TreeViewEvent,
  TreeViewEventType,
  TreeNode,
  TreeViewColorTheme,
  TreeNodeDataRetriever,
  PagedTreeNodeDataRetriever,
} from './interfaces';

@Component({
  selector: 'fui-tree-node',
  template: `
    <div class="fui-node-tree" (click)="onSelected()" [ngClass]="{ 'node-tree-selected': node.selected }">
      <div [style.margin-left.px]="calculatePadding()" class="node-tree">
        <span *ngIf="hasChildren" class="icon-template" (click)="onExpand()">
          <ng-container [ngTemplateOutlet]="getIconTemplate() ? getIconTemplate() : defaultIconTemplate"></ng-container>
          <ng-template #defaultIconTemplate>
            <clr-icon class="fui-less-icon" *ngIf="node.expanded" shape="fui-less"></clr-icon>
            <clr-icon class="fui-add-icon" *ngIf="!node.expanded" shape="fui-add"></clr-icon>
          </ng-template>
        </span>
        <span class="label">
          <ng-container
            [ngTemplateOutlet]="getNodeTemplate() ? getNodeTemplate() : defaultNodeRenderer"
            [ngTemplateOutletContext]="{ node: node }"
          ></ng-container>
          <ng-template #defaultNodeRenderer let-node="node">
            <span>{{ node.data.data[node.data.label] }}</span>
          </ng-template>
        </span>
      </div>
    </div>
    <div [style.margin-left.px]="calculatePadding() + 20">
      <clr-icon
        *ngIf="node.showLoader"
        class="fui-datagrid-loading-icon fui-loader-animation"
        shape="fui-spinner"
      ></clr-icon>
      <clr-icon *ngIf="node.loadError" class="fui-error-icon" shape="fui-error" aria-hidden="true"></clr-icon>
      <span *ngIf="node.loadError" class="error-msg">Couldn't load content</span>
    </div>
  `,
  styles: [
    `
      .fui-node-tree {
        border-radius: 3px;
        cursor: pointer;
      }
      .node-tree {
        height: 34px;
        width: 100%;
      }
      .label {
        line-height: 34px;
        font-size: 14px;
      }
      .node-tree-selected {
        box-shadow: 0 4px 6px 0 rgba(54, 71, 82, 0.12);
      }
      .icon-template {
        margin-right: 5px;
      }
      .fui-error-icon {
        height: 14px;
        width: 14px;
      }
      .error-msg {
        padding-left: 5px;
        font-size: 12px;
        vertical-align: bottom;
      }
      :host(.DARK_BLUE) .fui-node-tree:not(.node-tree-selected):hover {
        background: #353f4e;
      }
      :host(.DARK_BLUE) .node-tree-selected {
        color: #fff;
        background: #03a6ff;
      }
      :host(.LIGHT_BLUE) .fui-node-tree:not(.node-tree-selected):hover {
        background: #0295e6;
      }
      :host(.LIGHT_BLUE) .node-tree-selected {
        color: #252a3a;
        background: #fff;
      }
      :host(.WHITE) .fui-node-tree:not(.node-tree-selected):hover {
        background: #fff;
      }
      :host(.WHITE) .node-tree-selected {
        color: #fff;
        background: #03a6ff;
      }
      .fui-less-icon {
        height: 12px;
        width: 10px;
        margin-bottom: 2px;
      }
      .fui-add-icon {
        height: 12px;
        width: 12px;
        margin-bottom: 2px;
      }
    `,
  ],
})
export class FuiTreeNodeComponent<T> implements OnInit {
  @Output() onNodeEvent: EventEmitter<TreeViewEvent<any>> = new EventEmitter<TreeViewEvent<any>>();

  @Input() node: TreeNode<T>;

  @Input() theme: TreeViewColorTheme;

  @Input() dataRetriever: TreeNodeDataRetriever<T> | PagedTreeNodeDataRetriever<T>;

  @HostBinding('class') themeClass;

  // Shows loader icon on Expand or Scroll event
  showLoader: boolean;
  // Shows error message when unable to get more nodes
  loadError: boolean;
  // Hierarchical level to show parent-child relationship
  level: number = 0;
  // Indicates node can be expanded
  hasChildren: boolean;

  constructor() {}

  /**
   * Initiates Tree Node component and awaits to see if node has children while also setting its hierchical level
   * based on the number of parents it has
   *
   * @returns {Promise<void>}
   */
  async ngOnInit() {
    this.themeClass = this.theme;
    this.hasChildren = await this.dataRetriever.hasChildNodes(this.node);
    let parent = this.node.parent;
    while (parent != null) {
      parent = parent.parent;
      this.level++;
    }
  }

  /**
   * Calculates the needed padding based on nodes level and if it has children
   *
   * @returns {number}
   */
  calculatePadding(): number {
    return this.hasChildren ? this.level * 20 + 10 : this.level * 20 + 30;
  }
  /**
   * Invokes the node event based on the host Tree Node and its expanded or collapsed state
   */
  onExpand(): void {
    this.onNodeEvent.emit({
      getNode: () => {
        return this.node;
      },
      getType: () => {
        return !this.node.expanded ? TreeViewEventType.NODE_EXPANDED : TreeViewEventType.NODE_COLLAPSED;
      },
    });
  }

  /**
   * Invokes the node event based on the host Tree Node click event
   */
  onSelected(): void {
    this.onNodeEvent.emit({
      getNode: () => {
        return this.node;
      },
      getType: () => {
        return TreeViewEventType.NODE_CLICKED;
      },
    });
  }

  /**
   * Emits the expanded and selected Tree Node events
   *
   * @param {TreeViewEvent<any>} event
   */
  nodeEvent(event: TreeViewEvent<any>): void {
    this.onNodeEvent.emit(event);
  }

  /**
   * Gets the icon template reference the developer can use on a Tree Node with its current state
   *
   * @returns {TemplateRef<any> | null}
   */
  getIconTemplate(): TemplateRef<any> | null {
    return this.dataRetriever.hasOwnProperty('getIconTemplate') ? this.dataRetriever.getIconTemplate(this.node) : null;
  }

  /**
   * Gets the node template reference the developer can use on the Tree Node with its current state
   * @returns {TemplateRef<any>}
   */
  getNodeTemplate(): TemplateRef<any> | null {
    return this.dataRetriever.hasOwnProperty('getNodeTemplate') ? this.dataRetriever.getNodeTemplate() : null;
  }
}
