### NOIP2019复赛模拟24-day2 Slowset

先把题面放上来：
[pdf](/docs/Slowset.pdf)

再把[Naffygo](https://www.luogu.org/blog/wyh-cnyali/post-1030-slowset)的题解复制一遍。 (逃)

### 1 题意
~~题意非常清晰明了~~:给出一棵 n 点的树,初始时每个点上有一个人, m 次操作,每次操作令所有人向到 p 号点跑一条边(位于 p 的人不动),求最终有人的点数.

### 2 大致思路
考虑有哪些点经过操作后最有可能没有人在那个点上，很显然，是那些度数为 1 的点(因为其他点会有另外的点补充)。所以我们就可以先把所有度数为 1 的点丢进 set 里。

以上”删叶子节点“的想法非常重要。至于为什么要使用`set`，仅仅只是因为`set`的删除操作很迅速。

接下来，我们经过画图时间，发现对于每次操作，可以分情况讨论进行（我们指定的根为未被删除的点的根 (感性理解))：


* 若当前点没有被删除：这个时候很好处理，直接暴力遍历set中每一个点，然后把除自己以外的全部删除（当然，当前点很可能不是叶子节点）。

* 若当前点已被删除（没有人在该点上)
    显然，我们可以知道，这个点经过操作后不一定会有人。但是，必然会有原来没有人的(被标记为删除的)节点重新‘复活’。我们的目标是找到那一个节点，并把它的删除标记去掉。这个时候分为两种情况:

    + 若该点在当前指定根的子树内 :首先找出该点与所有度数为 1 (未被删除的中）的最深 lca ，显然此时所有点应该往 lca 到该点路径上的那个 lca 的儿子跳。 (可能讲的不是很清楚，感性理解)。那么复活的结点必然是lca的儿子没错了。

    + 若该点不在当前指定根的子树内: 那么所有点应该跳到当前根的父亲上。那么，复活的节点就是根的父亲。


最后统计答案时就统计没有标记的点的个数。

### 3 关于一些细节
1. 删除点时不用真的删除，打个标记即可。
2. set 删除迭代器元素时不能直接删，要存完后，迭代器先加再删。(可能因为STL的实现厂商不同，这一点有所出入)
3. 要注意及时维护叶子节点set和根（他们总是会发生变化）。为了便于维护，我们直接对每一个点开一个set，贮存它的出边指向的点。

### 4
一定要看代码，不然还真的不知道怎么写：
```cpp
#include<bits/stdc++.h>
const int N = 3e5 + 3;
 
using mSet = std::set<int>;
using mVec = std::vector<int>;
mSet pnt[N],leaf; /*"erase" in set is more chip,so we use set*/
mVec map[N]; /*however the map is so useless;*/
 
int n,m,mark[N],top,dep[N],fa[N][20],t,dfn[N],size[N],cnt{0};
 
/* @brief mark: 1: deleted;0: saved;
 * @brief top: to record the shallowest pnt,initly itskjha 1;
 * @brief dfn: the time when we visit the point;
 * */
 
inline int __get(int x,int y)
{
    if(dep[x] < dep[y]) std::swap(x,y);
    for(int i = t;i >= 0;i--)
        if(dep[y] <= dep[fa[x][i]]) x = fa[x][i];
    if(x == y) return x;
    for(int i = t;i >= 0;i--)
        if(fa[x][i] != fa[y][i]) x = fa[x][i],y = fa[y][i];
    return fa[x][0];
}
 
/*@brief __remove: remove the leaves except x;
 * */
inline void __remove(int x)
{
    static int queue[N],tail;
    tail = 0;
    /*FIXME*/
    /*TODO: use remove_if*/
    for(auto y : leaf) if(y ^ x)
        queue[++tail] = y;
    /*maintain the leaf set.Maybe it creates more leaves*/
 
    for(int i = 1;i <= tail;i++) {
        leaf.erase(queue[i]),mark[queue[i]] = 1;
        for(int j : pnt[queue[i]]) { /*though j is the begin*/
            pnt[j].erase(queue[i]);
            if(pnt[j].size() == 1) leaf.insert(j);
        }
        if(top == queue[i]) top = *pnt[queue[i]].begin(); /*chanhe the top*/
        pnt[queue[i]].clear(); /*wooh! u is marked!*/
    }
}
 
inline void __create(int x,int node) /*recover x from marked to unmarked,and link to node*/
{
    /*FIXME: if(pnt[node].size() == 1) then ...*/
    if(pnt[node].size() == 1)
        leaf.erase(node); /*important: the node is already not the leaf*/
    pnt[x].insert(node),pnt[node].insert(x);
    leaf.insert(x),mark[x] = 0;
    __remove(x);
}
 
void __dfs(int x,int f)
{
    dfn[x] = ++cnt,size[x] = 1;
    for(int i : map[x]) if(i ^ f) {
        /*multiplication*/
        dep[i] = dep[x] + 1;
        fa[i][0] = x;
        for(int j = 1;j <= t;j++) fa[i][j] = fa[fa[i][j - 1]][j - 1];
 
        __dfs(i,x);
        size[x] += size[i];
    }
}
 
inline void prepare()
{
    top = 1,dep[1] = 1,t = log2(n) + 1;
    for(int i =1;i <= n;i++)
        if(map[i].size() == 1) leaf.insert(i);
    __dfs(1,0);
}
 
inline void delMarkedPnt(int x)
{
    /*for case  that x is in subtree(top)*/
    if(dfn[top] <= dfn[x] && dfn[x] <= dfn[top] + size[top] - 1) {
        int k{0}; /*the deepest LCA*/
        dep[k] = 0;
        for(auto i : leaf) {
            int fa = __get(x,i);
            if(dep[fa] > dep[k]) k = fa;
        }
        for(int i = t;i >= 0;i--)
            if(dep[fa[x][i]] > dep[k]) x = fa[x][i];
        __create(x,k);
    } else {
        __create(fa[top][0],top);
        top = fa[top][0];
    }
}
 
inline void delUnmarkedPnt(int x)
{
    __remove(x);
}
 
/* @brief move()
 * move all the points forward to x.*/
inline void move(int x)
{
    if(mark[x]) /*its bad.x is deleted*/
        delMarkedPnt(x);
    else /*that's good.remove it easily.*/
        delUnmarkedPnt(x);
}
 
int main()
{
    scanf("%d %d",&n,&m);
 
    for(int i = 1,u,v;i < n;i++) {
        scanf("%d%d",&u,&v);
        pnt[u].insert(v),pnt[v].insert(u);
        map[u].push_back(v);
        map[v].push_back(u);
    }
 
    prepare();
 
    while(m--) {
        int p; scanf("%d",&p);
        move(p);
    }
    int ans{0};
    for(int i = 1;i <= n;i++) ans += !mark[i];
    std::cout << ans;
    exit(0);
}
```

_大部分文字 是Naffygo的劳动成果。_