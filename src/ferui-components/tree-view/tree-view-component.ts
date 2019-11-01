// import {
//   Component,
//   Input,
//   OnInit,
//   Output,
//   EventEmitter,
//   ViewChildren,
//   QueryList,
//   ViewChild,
//   OnDestroy,
//   TemplateRef,
// } from '@angular/core';
// import { BasicTreeNode } from './basic-tree-node';
// import {
//   TreeViewEvent,
//   TreeViewEventType,
//   TreeNode,
//   TreeViewConfiguration,
//   PagingParams,
//   TreeNodeDataRetriever,
//   TreeViewColorTheme,
//   TreeNodeData,
//   PagedTreeNodeDataRetriever,
//   PagedTreeNode,
//   FuiTreeViewComponentStyles,
// } from './interfaces';
// import { ServerSideTreeNode } from './paged-tree-node';
// import { FuiTreeNodeComponent } from './tree-node-component';
// import { FuiVirtualScrollerComponent } from '../virtual-scroller/virtual-scroller';
// import { Observable, fromEvent, Subscription } from 'rxjs';
// import { throttleTime } from 'rxjs/internal/operators';
//
// // ASK JON: [scrollThrottlingTime]="1000" (scroll)="handleScrollEvent()"
//
// @Component({
//   selector: 'fui-tree-view',
//   template: `
//     <div id="fui-tree-view-component" [ngStyle]="treeViewStyles" [ngClass]="colorTheme">
//       <fui-virtual-scroller #scroll [items]="treeViewItems" [bufferAmount]="BUFFER_AMOUNT" class="fui-virtual-scroller">
//         <fui-tree-node
//           *ngFor="let nodeWrapper of scroll.viewPortItems"
//           [node]="nodeWrapper.treeNode"
//           [selected]="nodeWrapper.selected"
//           [expanded]="nodeWrapper.expanded"
//           [flattenData]="nodeWrapper.flattenData"
//           [showLoader]="nodeWrapper.showLoader"
//           (onNodeEvent)="nodeEvent($event)"
//           [pagingParams]="pagingParams"
//           [theme]="colorTheme"
//         ></fui-tree-node>
//       </fui-virtual-scroller>
//     </div>
//     <button (click)="logMemory()">Memory</button>
//     <button (click)="logTree()">Tree</button>
//   `,
//   styles: [
//     `
//       #fui-tree-view-component {
//         padding: 10px;
//         overflow: auto;
//         margin: 10px;
//       }
//       .DARK_BLUE {
//         background: #252a3a;
//         color: #fff;
//       }
//       .LIGHT_BLUE {
//         background: #03a6ff;
//         color: #fff;
//       }
//       .WHITE {
//         background: #f5f8f9;
//         color: #252a3a;
//       }
//       .fui-virtual-scroller {
//         height: 100%;
//         width: 100%;
//         display: block;
//       }
//     `,
//   ],
// })
// export class FuiTreeViewComponent implements OnInit, OnDestroy {
//   @Input() treeNodeData: TreeNodeData<any>;
//
//   @Input() dataRetriever: TreeNodeDataRetriever<any> | PagedTreeNodeDataRetriever<any>;
//
//   @Input() config: TreeViewConfiguration;
//
//   @Output() onNodeEvent: EventEmitter<TreeViewEvent<any>> = new EventEmitter<TreeViewEvent<any>>();
//
//   @ViewChildren(FuiTreeNodeComponent) children: QueryList<FuiTreeNodeComponent>;
//
//   @ViewChild(FuiVirtualScrollerComponent) vs: FuiVirtualScrollerComponent;
//
//   treeViewStyles: FuiTreeViewComponentStyles;
//   colorTheme: TreeViewColorTheme;
//   pagingParams: PagingParams | null = null;
//   treeViewItems: TreeNodeWrapper[];
//   scrollObservable: Observable<any>;
//   scrollSubscription: Subscription;
//   BUFFER_AMOUNT: number = 10;
//   private SERVER_SIDE_COMPONENT: boolean = false;
//   private TREE_NODE_COMPONENT_HEIGHT: number = 34;
//   private DEFAULT_WIDTH: string = 'auto';
//   private DEFAULT_HEIGHT: string = '100%';
//   private DEFAULT_COLOR_THEME: TreeViewColorTheme = 'WHITE';
//   private IN_MEMORY_TREE_VIEW: TreeNodeWrapper[] = [];
//
//   constructor() {}
//
//   logMemory() {
//     console.log(this.IN_MEMORY_TREE_VIEW);
//   }
//
//   logTree() {
//     console.log(this.treeViewItems);
//   }
//
//   /**
//    * On initialization of Fui Tree View:
//    *  Based on DataRetriever passed in by developer, we check if tree view will be server side
//    *  Set default width & height if non were given in configuration by developer
//    *  Start to set the tree view data items array based on data passed in by developer
//    */
//   ngOnInit(): void {
//     this.SERVER_SIDE_COMPONENT = this.dataRetriever.hasOwnProperty('getPagedChildNodeData');
//     this.treeViewStyles = {
//       width: this.config.width ? this.config.width : this.DEFAULT_WIDTH,
//       height: this.config.height ? this.config.height : this.DEFAULT_HEIGHT,
//     };
//     this.colorTheme = this.config.colorVariation ? this.config.colorVariation : this.DEFAULT_COLOR_THEME;
//     this.treeViewItems = this.flattenAllData(
//       this.treeNodeData.data,
//       this.treeNodeData.label,
//       this.treeNodeData.childrenLabel,
//       0,
//       null
//     )
//       .filter(it => it.fui_level === 0)
//       .map(it => {
//         // On initial load only show first level of the hierarchical tree, if the dev wants/needs to open
//         // certain node right away they may do so by the public methods of component
//         return {
//           treeNode: this.makeTreeNode(it),
//           selected: false,
//           expanded: false,
//           flattenData: it,
//         };
//       });
//   }
//
//   /**
//    * After view is initialized, checks if tree view component will be server side and sets the default paging
//    * parameters and subscribes to the virtual scroller's scroll event
//    */
//   ngAfterViewInit(): void {
//     if (this.SERVER_SIDE_COMPONENT) {
//       // Get the paging params now that treeViewItems are loaded if node is a Server Side node
//       // Calculate limit by height of VS and height of tree node component plus a default buffer amount on first load
//       this.pagingParams = {
//         offset: 0,
//         limit: 0//this.vs.element.nativeElement.clientHeight / this.TREE_NODE_COMPONENT_HEIGHT + this.BUFFER_AMOUNT,
//       };
//       this.scrollObservable = fromEvent(this.vs.element.nativeElement, 'scroll');
//       this.scrollSubscription = this.scrollObservable.pipe(throttleTime(1000)).subscribe(() => {
//         this.handleScrollEvent();
//       });
//     }
//   }
//
//   /**
//    * If Tree View Component was server side, check its scroll subscription to unsubscribe
//    */
//   ngOnDestroy(): void {
//     if (this.scrollSubscription) {
//       this.scrollSubscription.unsubscribe();
//     }
//   }
//
//   /**
//    * Gets the Event Observable an outside service can subscribe to and listen to any Tree Node event
//    * @returns {Observable<TreeViewEvent<any>>}
//    */
//   public getEventObservable(): Observable<TreeViewEvent<any>> {
//     return this.onNodeEvent;
//   }
//
//   /**
//    * Public method to use from outside the FuiTreeViewComponent to select a tree node
//    * @param {TreeNode<any>} node
//    */
//   public selectNode(node: TreeNode<any>): void {
//     this.selectOneNode(node);
//   }
//
//   /**
//    * Public method to use from outside the FuiTreeViewComponent to toggle the expandsion of tree node
//    * @param {TreeNode<any>} node
//    * @param {TreeViewEventType} eventType
//    */
//   public toggleExpandNode(node: TreeNode<any>, eventType: TreeViewEventType): void {
//     this.toggleExpandOneNode(this.children, node, eventType);
//   }
//
//   /**
//    * Emits the Node Event for outside Tree View Component usage as well as ensures tree nodes properties are updated
//    * @param {TreeViewEvent<any>} event
//    */
//   private nodeEvent(event: TreeViewEvent<any>): void {
//     this.onNodeEvent.emit(event);
//     switch (event.getType()) {
//       case TreeViewEventType.NODE_EXPANDED:
//       case TreeViewEventType.NODE_COLLAPSED:
//         this.toggleExpandOneNode(this.children, event.getNode(), event.getType());
//         break;
//       case TreeViewEventType.NODE_CLICKED:
//         this.selectOneNode(event.getNode());
//         break;
//       default:
//         break;
//     }
//   }
//
//   /**
//    * Selects a TreeNode and deselects all other on the entire Tree View
//    * @param {TreeNode<any>} node
//    */
//   private selectOneNode(node: TreeNode<any>) {
//     this.treeViewItems.forEach(flattenItem => (flattenItem.selected = flattenItem.treeNode === node));
//   }
//
//   private loadMemoryItems(node: TreeNode<any>, nodesNeededToAdd: number): void {
//     const siblingNodeFound = this.IN_MEMORY_TREE_VIEW.find(memItem => {
//       return memItem.treeNode.getParentNode() === node.getParentNode();
//     });
//     console.log('load sibling memory', siblingNodeFound);
//     console.log('find a sibling for this node: ', node);
//     console.log('in memory', this.IN_MEMORY_TREE_VIEW);
//     if (siblingNodeFound) {
//       const siblingReference = siblingNodeFound.treeNode;
//       // Does sibling node have children loaded
//       const childrenNodes = this.IN_MEMORY_TREE_VIEW.filter((item) => item.treeNode.getParentNode() === siblingNodeFound.treeNode);
//       // add sibling and all its children. If nodes are still less than the nodesNeededToAdd we recursively call this method
//       const memoryItemsToAdd = childrenNodes.unshift(siblingNodeFound);
//       this.treeViewItems.splice(this.treeViewItems.length, 0, ...childrenNodes);
//       // Remove the added items from memory
//       childrenNodes.forEach((it) => {
//         this.IN_MEMORY_TREE_VIEW.splice(this.IN_MEMORY_TREE_VIEW.findIndex((i) => i === it), 1);
//       });
//       if (memoryItemsToAdd < nodesNeededToAdd) {
//         console.log('get more memory items');
//         this.loadMemoryItems(siblingReference, nodesNeededToAdd - memoryItemsToAdd);
//       }
//     }
//   }
//
//   /**
//    * Handles the virtual scroller's scroll event and decides whether to get more children nodes for a TreeNode if
//    * more are available
//    */
//   private handleScrollEvent() {
//     //console.log(this.vs.viewPortInfo.endIndexWithBuffer, this.vs.viewPortInfo.endIndex);
//     // If endWithBufferIndex minus endIndex is less than the buffer amount, we need to get more nodes
//     if (this.vs.viewPortInfo.endIndexWithBuffer - this.vs.viewPortInfo.endIndex < this.BUFFER_AMOUNT) {
//       // Limit - how many nodes we need to fill the buffer amount
//       const limit = this.BUFFER_AMOUNT - (this.vs.viewPortInfo.endIndexWithBuffer - this.vs.viewPortInfo.endIndex);
//       console.log('Buffer needs items to get: ', limit);
//       const parentToGetMoreChildrenFrom = this.treeViewItems[this.vs.viewPortInfo.endIndex].flattenData.fui_parent;
//       if (parentToGetMoreChildrenFrom) {
//         // Check if the parent has any children in memory: Worst case scenario memory tree is empty array
//         if (this.getAllDescendants(parentToGetMoreChildrenFrom, this.IN_MEMORY_TREE_VIEW).length > 0) {
//           //console.log('parent has children in memory');
//           const childrenNodes = this.getAllDescendants(parentToGetMoreChildrenFrom, this.IN_MEMORY_TREE_VIEW);//this.IN_MEMORY_TREE_VIEW.filter((item) => item.treeNode.getParentNode() === parentToGetMoreChildrenFrom);
//           this.treeViewItems.push(...childrenNodes);
//           childrenNodes.forEach((it) => {
//             this.IN_MEMORY_TREE_VIEW.splice(this.IN_MEMORY_TREE_VIEW.findIndex((i) => i === it), 1);
//           });
//           //console.log(this.treeViewItems);
//           //console.log(this.IN_MEMORY_TREE_VIEW);
//         } else {
//           //console.log('No children in memory, make api call');
//           // If no children in memory make an api call
//           // offset should be the number of children already loaded by parent and parent should already have offset set by
//           // its latest api call
//           //const childrenLoaded = parentToGetMoreChildrenFrom.getData().data._pagingParams.offset;
//           let childrenLoaded = 0;
//           this.treeViewItems.forEach(loadedItem => {
//             if (loadedItem.flattenData.fui_parent === parentToGetMoreChildrenFrom) {
//               childrenLoaded++;
//             }
//           });
//           const totalNodeChildren = parentToGetMoreChildrenFrom.getData().data._numberOfChildrenExpected;
//           // Check to see if it has more children available to load
//           if (totalNodeChildren > childrenLoaded) {
//             parentToGetMoreChildrenFrom.getData().data._pagingParams = { offset: childrenLoaded, limit: limit };
//             this.getChildrenForNode(parentToGetMoreChildrenFrom, null).then(() => {
//               //console.log('After getting api children, check if more in memory are needed');
//               // Check to see if the expected number of children returned won't fill the buffer
//               if (totalNodeChildren - childrenLoaded < limit) {
//                 // We check if any items in memory to load those back to fill buffer if needed
//                 // We gotta wait for the get request to come back before we load any in memory ones
//                 if (this.IN_MEMORY_TREE_VIEW.length > 0) {
//                   const extraNodesNeeded = limit - (totalNodeChildren - childrenLoaded);
//                   this.loadMemoryItems(parentToGetMoreChildrenFrom, extraNodesNeeded);
//                 }
//               }
//             });
//           } else {
//             // This Step means the node has no more children to load therefore we try to load any in memory items
//             if (totalNodeChildren - childrenLoaded < limit) {
//               // We check if any items in memory to load those back to fill buffer if needed
//               // We gotta wait for the get request to come back before we load any in memory ones
//               if (this.IN_MEMORY_TREE_VIEW.length > 0) {
//                 console.log('No memory children or api call to make so we check sibling memory');
//                // const extraNodesNeeded = limit - (totalNodeChildren - childrenLoaded);
//                 this.loadMemoryItems(parentToGetMoreChildrenFrom, limit);
//               }
//             }
//           }
//         }
//       }
//     }
//   }
//
//   /**
//    * Toggles the expanded property of the chosen TreeNode Component
//    * @param {QueryList<FuiTreeNodeComponent>} children
//    * @param {TreeNode<any>} node
//    * @param {TreeViewEventType} eventType
//    */
//   private toggleExpandOneNode(
//     children: QueryList<FuiTreeNodeComponent>,
//     node: TreeNode<any>,
//     eventType: TreeViewEventType
//   ): void {
//     children.forEach(childTreeNode => {
//       if (node === childTreeNode.node) {
//         // On NODE_EXPANDED of node, we make the GET request for its children and insert within flatten array
//         if (eventType === TreeViewEventType.NODE_EXPANDED) {
//           // On expansion of a server node we need to see how many children the view should get based on view height
//           // and buffer amount
//           if (this.SERVER_SIDE_COMPONENT) {
//             // How many nodes can the view hold
//             const totalViewHoldAmount = this.vs.element.nativeElement.clientHeight / this.TREE_NODE_COMPONENT_HEIGHT;
//             // How many nodes are currently on the view
//             //const currenViewHoldAmount = this.vs.viewPortInfo.endIndex - this.vs.viewPortInfo.startIndex;
//             //const bufferAmount = this.vs.viewPortInfo.endIndexWithBuffer - this.vs.viewPortInfo.endIndex;
//             const nodeIndex = this.vs.items.findIndex((item) => item.treeNode === node);
//             // How many nodes we need to fill buffer and the rest of the view
//             // PROBLEM: what happens if nodeIndex is below the threshold?
//             // Solution: if below threshold limit will be totalviewholdamont plus buffer
//             let limit = (totalViewHoldAmount + this.BUFFER_AMOUNT) - (nodeIndex + 1);
//             if (limit < 0) {
//               limit = totalViewHoldAmount + this.BUFFER_AMOUNT;
//             }
//             node.getData().data._pagingParams = { offset: 0, limit: limit };
//             // PROBLEM: if buffer is full the limit will be 0, so now what?
//             // SOLUTION: if limit is 0, we'll get the clicked nodes index and get the difference from it to the buffer index
//             // and this will be the new limit, once the nodes come back from the request, we'll delete out of tree array
//             // the nodes we don't need to show
//             //const limit = bufferAmount <= 0 ? this.BUFFER_AMOUNT + totalViewHoldAmount - currenViewHoldAmount : this.BUFFER_AMOUNT - bufferAmount;
//           }
//           this.getChildrenForNode(node, childTreeNode);
//         } else {
//           // If using a server side component we reset the paging parameters
//           if (this.SERVER_SIDE_COMPONENT) {
//             node.getData().data._pagingParams = {
//               offset: 0,
//               limit: this.vs.element.nativeElement.clientHeight / this.TREE_NODE_COMPONENT_HEIGHT + this.BUFFER_AMOUNT,
//             };
//             // Delete any descendants in memory as well
//             if (this.IN_MEMORY_TREE_VIEW.length > 0) {
//               this.getAllDescendants(node, this.IN_MEMORY_TREE_VIEW).forEach((memDec) => {
//                 const index = this.IN_MEMORY_TREE_VIEW.findIndex(c => c === memDec);
//                 if (index >= 0) {
//                   this.IN_MEMORY_TREE_VIEW.splice(index, 1);
//                 }
//               });
//             }
//           }
//           // Get all descendants tree view items from node and remove them from tree view items array
//           const descendants = this.getAllDescendants(node, this.treeViewItems);
//           descendants.forEach(dec => {
//             const index = this.treeViewItems.findIndex(c => c === dec);
//             if (index >= 0) {
//               this.treeViewItems.splice(index, 1);
//             }
//           });
//         }
//       }
//     });
//   }
//
//   private getChildrenForNode(node: TreeNode<any>, treeNodeComponent: FuiTreeNodeComponent | null): Promise<void> {
//     return new Promise((res, rej) => {
//       const promise = this.SERVER_SIDE_COMPONENT
//         ? (node as PagedTreeNode<any>).getPagedChildNodes(node.getData().data._pagingParams)
//         : node.getChildNodes();
//       // Find out if parent already has children loaded to place the loading icon in the right place:
//       let childrenLoaded = 0;
//       this.treeViewItems.forEach(loadedItem => {
//         if (loadedItem.flattenData.fui_parent === node) {
//           childrenLoaded++;
//         }
//       });
//       const nodeData =
//         childrenLoaded > 0 ? this.getLastFlattenChildItemOfNode(node) : this.treeViewItems.find(n => n.treeNode === node);
//       nodeData.showLoader = true;
//       promise.then(
//         childNodes => {
//           nodeData.showLoader = false;
//           this.insertNewChildren(childNodes, node);
//           res();
//         },
//         () => {
//           nodeData.showLoader = false;
//           if (treeNodeComponent) {
//             treeNodeComponent.setLoadingError(true);
//           }
//           rej();
//         }
//       );
//     });
//   }
//
//   private getLastFlattenChildItemOfNode(parentNode: TreeNode<any>): any {
//     const allIndexes = [];
//     this.treeViewItems.forEach(item => {
//       if (item.flattenData.fui_parent === parentNode) {
//         allIndexes.push(this.treeViewItems.findIndex(i => i === item));
//       }
//     });
//     return this.treeViewItems[Math.max(...allIndexes)];
//   }
//
//   private insertNewChildren(childrenNodes: TreeNode<any>[], parentNode: TreeNode<any>): void {
//     // flatten the array of data nodes and add to the current flatten object and set current node as their parent
//     const nodeDataArray = [];
//     childrenNodes.forEach(serverNode => nodeDataArray.push(serverNode.getData().data));
//     const newFlattenItems = this.flattenAllData(
//       nodeDataArray,
//       this.treeNodeData.label,
//       this.treeNodeData.childrenLabel,
//       parentNode.getData().data.fui_level + 1,
//       parentNode
//     )
//       .filter(flattenItem => flattenItem.fui_level === parentNode.getData().data.fui_level + 1)
//       .map(serverSideFlattenItem => {
//         return {
//           treeNode: this.makeTreeNode(serverSideFlattenItem),
//           expanded: false,
//           selected: false,
//           flattenData: serverSideFlattenItem,
//         };
//       });
//     // Make sure we insert child array where its parent index is and if parent already has some children
//     // loaded get the last child's index and insert there
//     const parentIndex = this.treeViewItems.findIndex(a => a.treeNode === parentNode);
//     const childrenLoaded = this.getAllDescendants(parentNode, this.treeViewItems).length;
//     const insertIntoIndex = childrenLoaded > 0 ? parentIndex + childrenLoaded + 1 : parentIndex + 1;
//     this.treeViewItems.splice(insertIntoIndex, 0, ...newFlattenItems);
//     this.treeViewItems.forEach(item => {
//       item.expanded = item.flattenData.expanded;
//       item.selected = item.flattenData.selected;
//     });
//     if (this.SERVER_SIDE_COMPONENT) {
//       // If on server side we set the new offset of the node
//       const currentPagingParams = parentNode.getData().data._pagingParams;
//       parentNode.getData().data._pagingParams = {
//         offset: currentPagingParams.offset + childrenNodes.length,
//         limit: currentPagingParams.limit
//       };
//       // We will move to memory any nodes that are below the buffer index threshold if childrenLoaded was 0 meaning it was an expansion action
//       if (childrenLoaded === 0) {
//         const maxTreeViewItemsExpected = (this.vs.element.nativeElement.clientHeight / this.TREE_NODE_COMPONENT_HEIGHT) + this.BUFFER_AMOUNT;
//         if (parentIndex >= maxTreeViewItemsExpected) {
//           // Means expanded node is below the threshold, we start the count after parent index to move items into mem
//           const indexBelowThreshold = parentIndex + newFlattenItems.length + this.BUFFER_AMOUNT;
//           this.IN_MEMORY_TREE_VIEW.push(...this.treeViewItems.slice(indexBelowThreshold));
//           this.treeViewItems.splice(indexBelowThreshold);
//           console.log('Node expanded was below threshold');
//         } else if (maxTreeViewItemsExpected < this.treeViewItems.length) {
//           const indexToStartCuttingFrom = maxTreeViewItemsExpected + 1;// parentIndex + newFlattenItems.length + 1;
//           console.log('index to cut at: ', indexToStartCuttingFrom);
//           this.IN_MEMORY_TREE_VIEW.push(...this.treeViewItems.slice(indexToStartCuttingFrom));
//           console.log('in memory tree view: ', this.IN_MEMORY_TREE_VIEW);
//           this.treeViewItems.splice(indexToStartCuttingFrom);
//           console.log('treeview items after slice', this.treeViewItems);
//         }
//       }
//     }
//   }
//
//   /**
//    * Gets all TreeNodeWrapper items decending from a TreeNode
//    * @param {TreeNode<any>} node
//    * @param {TreeNodeWrapper[]} flattenItemsArray
//    * @returns {any[]}
//    */
//   private getAllDescendants(node: TreeNode<any>, flattenItemsArray: TreeNodeWrapper[]): any[] {
//     const descendants = [];
//     flattenItemsArray.forEach(loadedItem => {
//       if (loadedItem.flattenData.fui_parent) {
//         const ancestorNodes = this.getAllNodeAncestorsFromNode(loadedItem.flattenData.fui_parent);
//         ancestorNodes.push(loadedItem.flattenData.fui_parent);
//         if (ancestorNodes.find(anc => anc === node)) {
//           descendants.push(loadedItem);
//         }
//       }
//     });
//     return descendants;
//   }
//
//   /**
//    * Gets a TreeNode's ancestors
//    * @param {TreeNode<any>} node
//    * @returns {TreeNode<any>[]}
//    */
//   private getAllNodeAncestorsFromNode(node: TreeNode<any>): TreeNode<any>[] {
//     let ancestors = [];
//     if (node.hasParent()) {
//       ancestors.push(node.getParentNode());
//       if (node.getParentNode().hasParent()) {
//         ancestors = ancestors.concat(this.getAllNodeAncestorsFromNode(node.getParentNode()));
//       }
//     }
//     return ancestors;
//   }
//
//   /**
//    * Creates a TreeNode<any> object from data given
//    * @param rawItem
//    * @returns {TreeNode<any>}
//    */
//   private makeTreeNode(rawItem): TreeNode<any> {
//     return this.SERVER_SIDE_COMPONENT
//       ? new ServerSideTreeNode(
//           { data: rawItem, label: this.treeNodeData.label, childrenLabel: this.treeNodeData.childrenLabel },
//           this.dataRetriever as PagedTreeNodeDataRetriever<any>,
//           rawItem.fui_parent
//         )
//       : new BasicTreeNode(
//           { data: rawItem, label: this.treeNodeData.label, childrenLabel: this.treeNodeData.childrenLabel },
//           this.dataRetriever,
//           rawItem.fui_parent
//         );
//   }
//
//   /**
//    * Checks a value to see if value is a plain javascript object
//    * @param value
//    * @returns {boolean}
//    */
//   private isPlainObject(value: any): boolean {
//     return value && typeof value === 'object' && value.constructor === Object;
//   }
//
//   /**
//    * Flattens a data object, whether array or hierarchical object, and flattens it to create a FlattenItems Array to
//    * use in the Tree View's virtual scroller
//    * @param originalObj
//    * @param {string} label
//    * @param {string} childrenLabel
//    * @param {number} level
//    * @param {TreeNode<any>} parent
//    * @returns {Array}
//    */
//   private flattenAllData(
//     originalObj: any,
//     label: string,
//     childrenLabel: string,
//     level: number,
//     parent: TreeNode<any> | null
//   ) {
//     let concatenatedArray = [];
//     const startingLevel = level ? level : 0;
//     if (this.isPlainObject(originalObj)) {
//       if (Object.keys(originalObj).find(val => val === label)) {
//         concatenatedArray.push(
//           Object.assign({}, originalObj, { fui_label: originalObj[label], fui_level: startingLevel, fui_parent: parent })
//         );
//         if (Object.keys(originalObj).find(val => val === childrenLabel)) {
//           // this means the object has a childrens array within it
//           if (originalObj[childrenLabel].length > 0) {
//             originalObj[childrenLabel].forEach(childObj => {
//               const newArr = this.flattenAllData(
//                 childObj,
//                 label,
//                 childrenLabel,
//                 startingLevel + 1,
//                 this.SERVER_SIDE_COMPONENT
//                   ? (parent as PagedTreeNode<any>)
//                   : // new ServerSideTreeNode(
//                     // { data: originalObj, label: this.treeNodeData.label, childrenLabel: this.treeNodeData.childrenLabel },
//                     // this.dataRetriever as PagedTreeNodeDataRetriever<any>, parent as PagedTreeNode<any>) :
//                     new BasicTreeNode(
//                       {
//                         data: originalObj,
//                         label: this.treeNodeData.label,
//                         childrenLabel: this.treeNodeData.childrenLabel,
//                       },
//                       this.dataRetriever,
//                       parent
//                     )
//               );
//               concatenatedArray = concatenatedArray.concat(newArr);
//             });
//           }
//         }
//       }
//     } else if (Array.isArray(originalObj)) {
//       originalObj.forEach(childObj => {
//         const newArr = this.flattenAllData(
//           childObj,
//           label,
//           childrenLabel,
//           startingLevel,
//           this.SERVER_SIDE_COMPONENT
//             ? (parent as PagedTreeNode<any>)
//             : // new ServerSideTreeNode(
//               //   { data: originalObj, label: this.treeNodeData.label, childrenLabel: this.treeNodeData.childrenLabel },
//               //   this.dataRetriever as PagedTreeNodeDataRetriever<any>, parent as PagedTreeNode<any>) :
//               new BasicTreeNode(
//                 { data: originalObj, label: this.treeNodeData.label, childrenLabel: this.treeNodeData.childrenLabel },
//                 this.dataRetriever,
//                 parent
//               )
//         );
//         concatenatedArray = concatenatedArray.concat(newArr);
//       });
//     }
//     return concatenatedArray;
//   }
// }
//
// interface TreeNodeWrapper {
//   treeNode: TreeNode<any>;
//   selected: boolean;
//   expanded: boolean;
//   flattenData: any;
//   showLoader?: boolean;
// }
//
//
//
