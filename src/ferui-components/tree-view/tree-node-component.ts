import { Component, Input, OnInit, Output, EventEmitter, TemplateRef } from '@angular/core';
import { TreeViewEvent, TreeViewEventType, TreeNode, PagingParams, TreeViewColorTheme } from './interfaces';
import { ServerSideTreeNode } from './paged-tree-node';

@Component({
  selector: 'fui-tree-node',
  template: `
    <div class="fui-tree-node" [ngClass]="theme">
      <div class="node-tree" [ngClass]="{ 'node-tree-selected': _selected }" [style.padding-left.px]="level * 10">
        <span *ngIf="hasChildren" (click)="onExpand()">
          <ng-container
            *ngIf="getIconTemplate()"
            class="icon-template"
            [ngTemplateOutlet]="getIconTemplate()"
          ></ng-container>
        </span>
        <span class="label" [style.padding-left.px]="hasChildren ? 0 : 10" (click)="onSelected()">
          {{ node.getData().data[node.getLabel()] }}
        </span>
      </div>
      <div [style.margin-left.px]="level * 10 + 10">
        <clr-icon
          *ngIf="loadingChildren"
          class="fui-datagrid-loading-icon fui-loader-animation"
          shape="fui-spinner"
        ></clr-icon>
        <clr-icon
          *ngIf="loadError && !loadingChildren"
          class="fui-error-icon"
          shape="fui-error"
          aria-hidden="true"
        ></clr-icon>
        <span *ngIf="loadError && !loadingChildren" class="error-msg">Couldn't load content</span>
      </div>
    </div>
  `,
  styles: [
    `
      .node-tree {
        height: 34px;
        border-radius: 3px;
        cursor: pointer;
      }
      .label {
        line-height: 34px;
        font-size: 14px;
      }
      .node-tree-selected {
        box-shadow: 0 4px 6px 0 rgba(54, 71, 82, 0.12);
      }
      .icon-template {
        margin-right: 10px;
      }
      .error-msg {
        padding-left: 10px;
      }
      .DARK_BLUE .node-tree:not(.node-tree-selected):hover {
        background: #353f4e;
      }
      .DARK_BLUE .node-tree-selected {
        color: #fff;
        background: #03a6ff;
      }
      .LIGHT_BLUE .node-tree:not(.node-tree-selected):hover {
        background: #0295e6;
      }
      .LIGHT_BLUE .node-tree-selected {
        color: #252a3a;
        background: #fff;
      }
      .WHITE .node-tree:not(.node-tree-selected):hover {
        background: #fff;
      }
      .WHITE .node-tree-selected {
        color: #fff;
        background: #03a6ff;
      }
    `,
  ],
})
export class FuiTreeNodeComponent implements OnInit {
  @Output() onNodeEvent: EventEmitter<TreeViewEvent<any>> = new EventEmitter<TreeViewEvent<any>>();

  @Input() node: TreeNode<any>;

  @Input() pagingParams?: PagingParams | null;

  @Input() theme: TreeViewColorTheme | null;

  @Input() rawData: any;

  hasChildren: boolean = false;
  loadingChildren: boolean = false;
  loadError: boolean = false;
  level: number = 0;
  _pagingParams: PagingParams;
  _numberOfChildrenExpected: number;
  _expanded: boolean;
  _selected: boolean;

  constructor() {}

  ngOnInit(): void {
    if (this.pagingParams) {
      // Deep clone initial params so that each child node starts at the original offset and limit
      this._pagingParams = JSON.parse(JSON.stringify(this.pagingParams));
      this.rawData._pagingParams = this._pagingParams;
    }
    // We check to see if the Tree Node has any children we could load
    this.node.hasChildren().then((hasChildren: boolean) => {
      this.hasChildren = hasChildren;
      if (this.pagingParams && this.hasChildren) {
        // Get number of children expected from Server Side Node
        (this.node as ServerSideTreeNode<any>).getNumberOfChildren().then(numberOfChildren => {
          this._numberOfChildrenExpected = numberOfChildren;
          this.rawData._numberOfChildrenExpected = this._numberOfChildrenExpected;
        });
      }
    });
    this.level = this.node.getData().data['fui_level'];
  }

  @Input()
  set selected(select: boolean) {
    this._selected = select;
    this.rawData.selected = this._selected;
  }

  @Input()
  set expanded(expand: boolean) {
    this._expanded = expand;
    this.rawData.expanded = this._expanded;
  }

  setLoadingChildren(loading: boolean): void {
    this.loadingChildren = loading;
  }

  /**
   * Invokes the node event based on the host Tree Node and its expanded or collapsed state
   */
  onExpand(): void {
    this._expanded = !this._expanded;
    this.rawData.expanded = this._expanded;
    this.onNodeEvent.emit({
      getNode: () => {
        return this.node as TreeNode<any>;
      },
      getType: () => {
        return this._expanded ? TreeViewEventType.NODE_EXPANDED : TreeViewEventType.NODE_COLLAPSED;
      },
    });
  }

  /**
   * Invokes the node event based on the host Tree Node click event
   */
  onSelected(): void {
    this.rawData.selected = true;
    this.onNodeEvent.emit({
      getNode: () => {
        return this.node as TreeNode<any>;
      },
      getType: () => {
        return TreeViewEventType.NODE_CLICKED;
      },
    });
  }

  /**
   * Emits the expanded and selected Tree Node events
   * @param {TreeViewEvent<any>} event
   */
  nodeEvent(event: TreeViewEvent<any>): void {
    this.onNodeEvent.emit(event);
  }

  /**
   * Gets the icon template reference the developer can use on a Tree Node with its current state
   * @returns {TemplateRef<any> | null}
   */
  getIconTemplate(): TemplateRef<any> | null {
    return this.node.getIcon(this._expanded, this._selected);
  }
}
