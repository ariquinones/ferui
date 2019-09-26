import { BasicTreeNode } from './basic-tree-node';
import { TreeNodeData, PagedTreeNodeDataRetriever, PagingParams, PagedTreeNode } from './interfaces';

export class ServerSideTreeNode<T> extends BasicTreeNode<T> implements PagedTreeNode<T> {
  constructor(data: TreeNodeData<T>, dataRetriever: PagedTreeNodeDataRetriever<T>, parent: PagedTreeNode<T> | null) {
    super(data, dataRetriever, parent);
  }

  getPagedChildNodes(pagingParams: PagingParams): Promise<Array<PagedTreeNode<T>>> {
    return (this.dataRetriever as PagedTreeNodeDataRetriever<T>)
      .getPagedChildNodeData(this, pagingParams)
      .then(childData => {
        return childData.map(it => new ServerSideTreeNode(it, this.dataRetriever as PagedTreeNodeDataRetriever<T>, this));
      });
  }

  getPagedParentNode(): PagedTreeNode<T> | null {
    return this.parent as PagedTreeNode<T>;
  }

  getNumberOfChildren(): Promise<number> {
    return (this.dataRetriever as PagedTreeNodeDataRetriever<T>).getNumberOfChildNodes(this);
  }
}
