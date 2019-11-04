## 道路相遇

### 题目描述

跟你一张无向图，有$Q$次查询,每一次查询给定$(x,y)$，输出$x,y$之间的必经点个数。

### 题解

观察题目，发现必经点个数其实就是两点之间**割点**的个数。但是直接在原图上面不好处理。我们考虑对其进行点双缩点。缩点之后有一个好处，那就是原图被我们转换成了若干棵枝繁叶茂的大树！这个时候，查询就很好应对了。每一次询问，我们找到LCA，然后就可以快速地计算割点个数了。

代码：( 代码较丑，不喜勿喷（逃)

```cpp
#include<bits/stdc++.h>
const int N = 5e6 + 3,M = 5e6 + 3;
int n,m,q;

namespace IO
{
	inline char getChar()
	{
		static char buf[100000],*p1 = buf,*p2 = buf;
		return p1 == p2 && (p2 = (p1 = buf) +
			fread(buf,1,100000,stdin),p1 == p2) ? EOF : *p1++;
	}
	inline int read()
	{
		int s = 0,f  = 1; char ch;
		while(!isdigit(ch = getChar())) if(ch == '-') f = -1;
		while(isdigit(ch)) s = s * 10 + ch - '0',ch = getChar();
		return s * f;
	}
};
using namespace IO;

namespace Graph
{
	int ver[M << 1],head[N],nxt[M << 1],tot = 1;
	int nver[M << 1],nhead[N],nnxt[M << 1],ntot = 1;
	int newNum,w[N],val[N];

	inline void add(int* ver0,int* head0,int* nxt0,int& tot0,
			const int x,const int y)
	{
		ver0[++tot0] = y,nxt0[tot0] = head0[x],head0[x] = tot0;
		ver0[++tot0] = x,nxt0[tot0] = head0[y],head0[y] = tot0;
	}
};

using namespace Graph;

namespace Tarjan
{
	int dfn[N],low[N],cnt = 0,cut[N];
	int dcc = 0,bel[N];
	std::stack<int> st;
	std::vector<int> vec[N];
	using namespace std;
	void tarjan(int x,int root)
	{
		dfn[x] = low[x] = ++cnt;
		st.push(x);
		int flag = 0;
		for(int i = head[x];i;i = nxt[i]) {
			if(!dfn[ver[i]]) {
				tarjan(ver[i],root);
				low[x] = std::min(low[x],low[ver[i]]);
				if(low[ver[i]] >= dfn[x]) {
					if(++flag > 1 || x != root)
						cut[x] = 1;
					dcc++; int tmp;
					do {
						tmp = st.top(),st.pop();
						vec[dcc].push_back(tmp);
						bel[tmp] = dcc;
					} while(tmp != ver[i]);
					vec[dcc].push_back(x);
					bel[x] = dcc;
				}
			} else low[x] = std::min(low[x],dfn[ver[i]]);
		}
	}
	void getDcc()
	{
		for(int i = 1;i <= n;i++)
			if(!dfn[i]) tarjan(i,i);
		newNum = dcc;
		for(int i = 1;i <= n;i++)
			if(cut[i]) bel[i] = ++newNum,w[newNum] = 1;
		for(int i = 1;i <= dcc;i++) for(int j : vec[i])
			if(cut[j]) add(nver,nhead,nnxt,ntot,i,bel[j]);
	}
};
using namespace Tarjan;

namespace LCA
{
	int dep[N],fa[N][23],t;
	std::queue<int> que;
	inline int queryf(int x,int y)
	{
		if(dep[x] < dep[y]) std::swap(x,y);
		for(int i = t;i >= 0;i--)
			if(dep[fa[x][i]] >= dep[y]) x = fa[x][i];
		if(x == y) return x;
		for(int i = t;i >= 0;i--)
			if(fa[x][i] != fa[y][i]) x = fa[x][i],y = fa[y][i];
		return fa[x][0];
	}
	inline int query(int x,int y)
	{
		int fxy = queryf(x,y);
		return val[x] + val[y] - val[fxy] - val[fa[fxy][0]]
			- w[x] - w[y] + 2;
	}
	inline void bfs(int x)
	{
		que.push(x),dep[x] = 1; /*FIXME*/
		while(que.size()) {
			int x = que.front(); que.pop();
			for(int i = nhead[x];i;i = nnxt[i]) {
#define to nver[i]
				if(dep[to]) continue;
				dep[to] = dep[x] + 1;
				val[to] = val[x] + w[to];
				fa[to][0] = x;
				for(int j = 1;j <= t;j++)
					fa[to][j] = fa[fa[to][j - 1]][j - 1];
				que.push(to);
#undef to
			}
		}
	}

	inline void pre()
	{
		t = log2(newNum) + 1;
		for(int i = 1;i <= newNum;i++)
			if(!dep[i]) bfs(i);
	}
};
using namespace LCA;

int main()
{
#ifdef CLANG
	freopen("rtqs.in","r",stdin);
	freopen("rtqs.out","w",stdout);
#endif
	n = read(),m = read();
	for(int i = 1,u,v;i <= m;i++) {
		u = read(),v = read();
		add(ver,head,nxt,tot,u,v);
	}

	getDcc();
	pre();

	q = read();
	int x,y;
	while(q--) {
		x = read(),y = read();
		printf("%d\n",query(bel[x],bel[y]));
	}
	exit(0);
}


```