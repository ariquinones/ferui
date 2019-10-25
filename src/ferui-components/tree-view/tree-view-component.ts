import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChildren,
  QueryList,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { BasicTreeNode } from './basic-tree-node';
import {
  TreeViewEvent,
  TreeViewEventType,
  TreeNode,
  TreeViewConfiguration,
  PagingParams,
  TreeNodeDataRetriever,
  TreeViewColorTheme,
  TreeNodeData,
  PagedTreeNodeDataRetriever,
  PagedTreeNode,
  FuiTreeViewComponentStyles,
} from './interfaces';
import { ServerSideTreeNode } from './paged-tree-node';
import { FuiTreeNodeComponent } from './tree-node-component';
import { FuiVirtualScrollerComponent } from '../virtual-scroller/virtual-scroller';
import { Observable, fromEvent, Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/internal/operators';

// ASK JON: [scrollThrottlingTime]="1000" (scroll)="handleScrollEvent()"
// ASK JON: how to get initial limit??

@Component({
  selector: 'fui-tree-view',
  template: `
    <div id="fui-tree-view-component" [ngStyle]="treeViewStyles" [ngClass]="colorTheme">
      <fui-virtual-scroller #scroll [items]="treeViewItems" class="fui-virtual-scroller">
        <fui-tree-node
          *ngFor="let nodeWrapper of scroll.viewPortItems"
          [node]="nodeWrapper.treeNode"
          [selected]="nodeWrapper.selected"
          [expanded]="nodeWrapper.expanded"
          [rawData]="nodeWrapper.flattenData"
          (onNodeEvent)="nodeEvent($event)"
          [pagingParams]="pagingParams"
          [theme]="colorTheme"
        >
        </fui-tree-node>
      </fui-virtual-scroller>
    </div>
  `,
  styles: [
    `
      #fui-tree-view-component {
        padding: 10px;
        overflow: auto;
        margin: 10px;
      }
      .DARK_BLUE {
        background: #252a3a;
        color: #fff;
      }
      .LIGHT_BLUE {
        background: #03a6ff;
        color: #fff;
      }
      .WHITE {
        background: #f5f8f9;
        color: #252a3a;
      }
      .fui-virtual-scroller {
        height: 100%;
        width: 100%;
        display: block;
      }
    `,
  ],
})
export class FuiTreeViewComponent implements OnInit, OnDestroy {
  @Input() treeNodeData: TreeNodeData<any>;

  @Input() rawDataRetriever: TreeNodeDataRetriever<any> | PagedTreeNodeDataRetriever<any>;

  @Input() config: TreeViewConfiguration;

  @Input() serverSideComponent?: boolean = false;

  @Output() onNodeEvent: EventEmitter<TreeViewEvent<any>> = new EventEmitter<TreeViewEvent<any>>();

  @ViewChildren(FuiTreeNodeComponent) children: QueryList<FuiTreeNodeComponent>;

  @ViewChild(FuiVirtualScrollerComponent) vs: FuiVirtualScrollerComponent;

  treeViewStyles: FuiTreeViewComponentStyles;
  colorTheme: TreeViewColorTheme;
  pagingParams: PagingParams | null = null;
  treeViewItems: TreeNodeWrapper[];
  scrollObservable: Observable<any>;
  scrollSubscription: Subscription;
  private currentTreeViewItems: TreeNodeWrapper[];
  private SERVER_SIDE_COMPONENT: boolean = false;

  constructor() {}

  ngOnInit(): void {
    this.SERVER_SIDE_COMPONENT = this.serverSideComponent;
    if (this.SERVER_SIDE_COMPONENT) {
      // We set the initial paging params if node is a Server Side node
      // the virtual scroller should be the one to give us the limit since it will calculate the height and
      // how many node components we could render at one time
      this.pagingParams = { offset: 0, limit: 10 };
      this.scrollObservable = fromEvent(this.vs.element.nativeElement, 'scroll');
      this.scrollSubscription = this.scrollObservable.pipe(throttleTime(1000)).subscribe(() => {
        this.handleScrollEvent();
      });
    }
    this.treeViewStyles = {
      width: this.config.width ? this.config.width : 'auto',
      height: this.config.height ? this.config.height : '200px',
    };
    this.colorTheme = this.config.colorVariation ? this.config.colorVariation : 'WHITE';
    this.treeViewItems = this.flattenAllData(
      this.treeNodeData.data,
      this.treeNodeData.label,
      this.treeNodeData.childrenLabel,
      0,
      null
    )
      .filter(it => it.fui_level === 0)
      .map(it => {
        // On initial load only show first level of the hierarchical tree, if the dev wants/needs to open
        // certain node they may do so by the public methods of component
        return {
          treeNode: this.makeTreeNode(it),
          selected: false,
          expanded: false,
          flattenData: it,
        };
      });
    this.currentTreeViewItems = this.treeViewItems;
  }

  ngOnDestroy(): void {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
  }

  /**
   * Gets the Event Observable an outside service can subscribe to and listen to any Tree Node event
   * @returns {Observable<TreeViewEvent<any>>}
   */
  public getEventObservable(): Observable<TreeViewEvent<any>> {
    return this.onNodeEvent;
  }

  /**
   * Public method to use from outside the FuiTreeViewComponent to select a tree node
   * @param {TreeNode<any>} node
   */
  public selectNode(node: TreeNode<any>): void {
    this.selectOneNode(this.children, node);
  }

  /**
   * Public method to use from outside the FuiTreeViewComponent to toggle the expandsion of tree node
   * @param {TreeNode<any>} node
   * @param {TreeViewEventType} eventType
   */
  public toggleExpandNode(node: TreeNode<any>, eventType: TreeViewEventType): void {
    this.toggleExpandOneNode(this.children, node, eventType);
  }

  private handleScrollEvent() {
    // on scroll we need to know the offset and limit to make any necessary requests
    // paging params: limit - the limit available at the vs viewport
    const limit = this.vs.viewPortInfo.endIndex - this.vs.viewPortInfo.startIndex - 1;
    const parentToGetMoreChildrenFrom = this.currentTreeViewItems[this.vs.viewPortInfo.endIndex].flattenData.fui_parent;
    // offset should be the number of children already loaded by parent
    let childrenLoaded = 0;
    this.currentTreeViewItems.forEach(loadedItem => {
      if (loadedItem.flattenData.fui_parent === parentToGetMoreChildrenFrom) {
        childrenLoaded++;
      }
    });
    if (parentToGetMoreChildrenFrom) {
      // Once the parent tree node is found, we check to see if it has more children available to load
      if (parentToGetMoreChildrenFrom.getData().data._numberOfChildrenExpected > childrenLoaded) {
        parentToGetMoreChildrenFrom.getData().data._pagingParams = { offset: childrenLoaded, limit: limit };
        this.toggleExpandOneNode(this.children, parentToGetMoreChildrenFrom, TreeViewEventType.NODE_EXPANDED);
      }
    }
  }

  /**
   * Emits the Node Event for outside Tree View Component usage as well as ensures tree nodes properties are updated
   * @param {TreeViewEvent<any>} event
   */
  private nodeEvent(event: TreeViewEvent<any>): void {
    this.onNodeEvent.emit(event);
    switch (event.getType()) {
      case TreeViewEventType.NODE_EXPANDED:
      case TreeViewEventType.NODE_COLLAPSED:
        this.toggleExpandOneNode(this.children, event.getNode(), event.getType());
        break;
      case TreeViewEventType.NODE_CLICKED:
        this.selectOneNode(this.children, event.getNode());
        break;
      default:
        break;
    }
  }

  /**
   * Selects a TreeNode and deselects all other on the entire Tree View
   * @param {QueryList<FuiTreeNodeComponent>} children
   * @param {TreeNode<any>} node
   */
  private selectOneNode(children: QueryList<FuiTreeNodeComponent>, node: TreeNode<any>) {
    children.forEach(it => {
      it.selected = node === it.node;
    });
  }

  /**
   * Toggles the expanded property of the chosen TreeNode Component
   * @param {QueryList<FuiTreeNodeComponent>} children
   * @param {TreeNode<any>} node
   * @param {TreeViewEventType} eventType
   */
  private toggleExpandOneNode(
    children: QueryList<FuiTreeNodeComponent>,
    node: TreeNode<any>,
    eventType: TreeViewEventType
  ): void {
    children.forEach(childTreeNode => {
      if (node === childTreeNode.node) {
        // On NODE_EXPANDED of node, we make the GET request for its children and insert within flatten array
        if (eventType === TreeViewEventType.NODE_EXPANDED) {
          if (this.SERVER_SIDE_COMPONENT) {
            childTreeNode.setLoadingChildren(true);
            (node as PagedTreeNode<any>)
              .getPagedChildNodes(node.getData().data._pagingParams)
              .then(serverSideTreeNodes => {
                childTreeNode.setLoadingChildren(false);
                this.insertNewChildren(serverSideTreeNodes, node);
              });
          } else {
            childTreeNode.setLoadingChildren(true);
            node.getChildNodes().then(childNodes => {
              childTreeNode.setLoadingChildren(false);
              this.insertNewChildren(childNodes, node);
            });
          }
        } else {
          // Get all descendants tree view items from node and remove them from tree view items array
          const descendants = this.getAllDescendants(node);
          descendants.forEach(dec => {
            const index = this.treeViewItems.findIndex(c => c === dec);
            if (index >= 0) {
              this.treeViewItems.splice(index, 1);
            }
          });
        }
      }
    });
    this.currentTreeViewItems = this.treeViewItems;
  }

  private insertNewChildren(childrenNodes: TreeNode<any>[], parentNode: TreeNode<any>): void {
    // flatten the array of data nodes and add to the current flatten object and set current node as their parent
    const nodeDataArray = [];
    childrenNodes.forEach(serverNode => nodeDataArray.push(serverNode.getData().data));
    const newFlattenItems = this.flattenAllData(
      nodeDataArray,
      this.treeNodeData.label,
      this.treeNodeData.childrenLabel,
      parentNode.getData().data.fui_level + 1,
      parentNode
    )
      .filter(flattenItem => flattenItem.fui_level === parentNode.getData().data.fui_level + 1)
      .map(serverSideFlattenItem => {
        return {
          treeNode: this.makeTreeNode(serverSideFlattenItem),
          expanded: false,
          selected: false,
          flattenData: serverSideFlattenItem,
        };
      });
    // Make sure we insert child array where its parent index is and if parent already has some children
    // loaded get the last child's index and insert there
    const parentIndex = this.treeViewItems.findIndex(a => a.treeNode === parentNode);
    let childrenLoaded = 0;
    this.treeViewItems.forEach(loadedItem => {
      if (loadedItem.flattenData.fui_parent === parentNode) {
        childrenLoaded++;
      }
    });
    const insertIntoIndex = childrenLoaded > 0 ? parentIndex + childrenLoaded + 1 : parentIndex + 1;
    this.treeViewItems.splice(insertIntoIndex, 0, ...newFlattenItems);
    this.treeViewItems.forEach(item => {
      item.expanded = item.flattenData.expanded;
      item.selected = item.flattenData.selected;
    });
  }

  private getAllDescendants(node: TreeNode<any>): any[] {
    const descendants = [];
    this.treeViewItems.forEach(loadedItem => {
      if (loadedItem.flattenData.fui_parent) {
        const ancestorNodes = this.getAllNodeAncestorsFromNode(loadedItem.flattenData.fui_parent);
        ancestorNodes.push(loadedItem.flattenData.fui_parent);
        if (ancestorNodes.find(anc => anc === node)) {
          descendants.push(loadedItem);
        }
      }
    });
    return descendants;
  }

  private getAllNodeAncestorsFromNode(node: TreeNode<any>) {
    let ancestors = [];
    if (node.hasParent()) {
      ancestors.push(node.getParentNode());
      if (node.getParentNode().hasParent()) {
        ancestors = ancestors.concat(this.getAllNodeAncestorsFromNode(node.getParentNode()));
      }
    }
    return ancestors;
  }

  private makeTreeNode(rawItem): TreeNode<any> {
    return this.SERVER_SIDE_COMPONENT
      ? new ServerSideTreeNode(
          { data: rawItem, label: this.treeNodeData.label, childrenLabel: this.treeNodeData.childrenLabel },
          this.rawDataRetriever as PagedTreeNodeDataRetriever<any>,
          rawItem.fui_parent
        )
      : new BasicTreeNode(
          { data: rawItem, label: this.treeNodeData.label, childrenLabel: this.treeNodeData.childrenLabel },
          this.rawDataRetriever,
          rawItem.fui_parent
        );
  }

  private isPlainObject(value: any): boolean {
    return value && typeof value === 'object' && value.constructor === Object;
  }

  private flattenAllData(
    originalObj: any,
    label: string,
    childrenLabel: string,
    level: number,
    parent: TreeNode<any> | null
  ) {
    let concatenatedArray = [];
    const startingLevel = level ? level : 0;
    if (this.isPlainObject(originalObj)) {
      if (Object.keys(originalObj).find(val => val === label)) {
        concatenatedArray.push(
          Object.assign({}, originalObj, { fui_label: originalObj[label], fui_level: startingLevel, fui_parent: parent })
        );
        if (Object.keys(originalObj).find(val => val === childrenLabel)) {
          // this means the object has a childrens array within it
          if (originalObj[childrenLabel].length > 0) {
            originalObj[childrenLabel].forEach(childObj => {
              const newArr = this.flattenAllData(
                childObj,
                label,
                childrenLabel,
                startingLevel + 1,
                this.SERVER_SIDE_COMPONENT
                  ? (parent as PagedTreeNode<any>)
                  : // new ServerSideTreeNode(
                    // { data: originalObj, label: this.treeNodeData.label, childrenLabel: this.treeNodeData.childrenLabel },
                    // this.rawDataRetriever as PagedTreeNodeDataRetriever<any>, parent as PagedTreeNode<any>) :
                    new BasicTreeNode(
                      {
                        data: originalObj,
                        label: this.treeNodeData.label,
                        childrenLabel: this.treeNodeData.childrenLabel,
                      },
                      this.rawDataRetriever,
                      parent
                    )
              );
              concatenatedArray = concatenatedArray.concat(newArr);
            });
          }
        }
      }
    } else if (Array.isArray(originalObj)) {
      originalObj.forEach(childObj => {
        const newArr = this.flattenAllData(
          childObj,
          label,
          childrenLabel,
          startingLevel,
          this.SERVER_SIDE_COMPONENT
            ? (parent as PagedTreeNode<any>)
            : // new ServerSideTreeNode(
              //   { data: originalObj, label: this.treeNodeData.label, childrenLabel: this.treeNodeData.childrenLabel },
              //   this.rawDataRetriever as PagedTreeNodeDataRetriever<any>, parent as PagedTreeNode<any>) :
              new BasicTreeNode(
                { data: originalObj, label: this.treeNodeData.label, childrenLabel: this.treeNodeData.childrenLabel },
                this.rawDataRetriever,
                parent
              )
        );
        concatenatedArray = concatenatedArray.concat(newArr);
      });
    }
    return concatenatedArray;
  }
}

interface TreeNodeWrapper {
  treeNode: TreeNode<any>;
  selected: boolean;
  expanded: boolean;
  flattenData: any;
}
