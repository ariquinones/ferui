import { TreeNode, TreeNodeData, TreeNodeDataRetriever } from './interfaces';
import { TemplateRef } from '@angular/core';

export class BasicTreeNode<T> implements TreeNode<T> {
  constructor(
    protected data: TreeNodeData<T>,
    protected dataRetriever: TreeNodeDataRetriever<T>,
    protected parent: TreeNode<T> | null
  ) {}

  getData(): TreeNodeData<T> {
    return this.data;
  }

  getLabel(): string {
    return this.data.label;
  }

  hasChildren(): Promise<boolean> {
    return this.dataRetriever.hasChildNodes(this).then((hasChildren: boolean) => {
      return hasChildren;
    });
  }

  getChildNodes(): Promise<Array<TreeNode<T>>> {
    return this.dataRetriever.getChildNodeData(this).then(childData => {
      return childData.map(it => new BasicTreeNode(it, this.dataRetriever, this));
    });
  }

  hasParent(): boolean {
    return this.parent != null;
  }

  getParentNode(): TreeNode<T> | null {
    return this.parent;
  }

  getIcon(isExpanded: boolean, isSelected: boolean): TemplateRef<any> | null {
    return this.dataRetriever.getIconTemplate(this, isExpanded, isSelected);
  }
}
