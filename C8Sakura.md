## Sakura（多校联考）
### Description
[link](http://lk.yali.edu.cn/problem/126/t2.pdf)

### 题解
这一道题目综合性比较强，有一定的思维难度，但又不是难而不可做的毒瘤题目。适合作为CSPD2T2。
好了，直接说题解：
### 部分分
先考虑怎么处理图为一棵树的子任务。这个时候，两点之间的最大流就是他们树上路径的最小值。因为**每一条边都会有一定的贡献**，所以我们单独考虑每一条边对答案的影响。把树边从大到小排序，之后用类似于kruskal的方法，计算合并时两个联通块产生的贡献。因为当前边肯定是两个联通块中最小的边，所以它也必定是新增加的任意点对的最大流；同时，对于一个联通块$S$，我们记$A(S)=\sum_{i\in S}p^{(i-1)n}$,$B(S)=\sum_{i\in S}p^{i}$。所以，每一次用权值为$v$的边合并$S_1$,$S_2$的贡献就是

$$(A(S_1)\cdot B(S_2) + A(S_2)\cdot B(S_1))\cdot v$$

### 满分

首先,我们可以发现,当边权为1时,任意两点最大流≤ 2,等价于这张图是仙人掌。
$$\mathbf{Proof}$$:
考虑反证,假设边(u,v)同时存在于两个简单环中。由于最大流=最小割,将点u和点v分开至少需要把两个简单环都断开并把(u,v)断开,即maxf low(u, v) ≥ 3,与题设矛盾。

既然每一条边最多存在于一个简单环中,考虑新图任意两点最大流,也就是最小割。显然最小割要么割掉一条桥边,要么割掉同一个环里的两条边。考虑如果割掉同一个环里的两条边,无论怎样环中边权最小的那条边一定会被割掉。那么我们可以对于每个环,将其边权最小的边删去,剩下的边的边权加上删去的边的边权,这样操作之后任意两点的最大流不会改变。此时，我们成功的转换成为了树上问题。

### 代码

```cpp
#include<bits/stdc++.h>
const int N = 6e5 + 3,M = 6e5 + 3;
const int oo = 0x3f3f3f3f;
typedef long long ll;
#define int ll

const ll MOD = 998244353;

int n,m,p;
ll ans = 0;

namespace Graph
{
	typedef std::pair<ll,int> pp;
	typedef int Stack[N];
	struct Edge {int x,y,z;} e[M];
	int ver[M << 1],nxt[M << 1],edge[M << 1],head[N],tot = 1;
	int root,dfn[N],low[N],ins[N],cnt = 0,pre[N],tail = 0;
	Stack rec; std::stack<int> stk;

	inline void add(int x,int y,int z)
	{
		ver[++tot] = y,edge[tot] = z,nxt[tot] = head[x],head[x] = tot;
		ver[++tot] = x,edge[tot] = z,nxt[tot] = head[y],head[y] = tot;
	}

	void dfs(int x,int fa)
	{
		dfn[x] = low[x] = ++cnt;
		for(int i = head[x];i;i = nxt[i]) {
			if(!dfn[ver[i]]) {
				stk.push(i >> 1),pre[i >> 1] = x;
				dfs(ver[i],x);
				low[x] = std::min(low[x],low[ver[i]]);

				/*find the v-dcc*/
				if(low[ver[i]] == dfn[x]) {
					int tmp,min = MOD,idx; tail = 0;
					do {
						tmp = stk.top(),stk.pop();
						rec[++tail] = tmp;
						if(e[tmp].z < min) {
							min = e[tmp].z;
							idx = tmp;
						}
					} while(pre[tmp] != x);
					for(;tail;tail--)
						if(idx != rec[tail])
							(e[rec[tail]].z += min);
					e[idx].z = 0;
				} else if(low[ver[i]] > dfn[x]) {
					int tmp;
					do {tmp = stk.top(),stk.pop();}
					while(pre[tmp] != x);
				}
			} else if(!pre[i >> 1]) {
				stk.push(i >> 1),pre[i >> 1] = x;
			  	low[x] = std::min(low[x],dfn[ver[i]]);
			}
		}
	}
};

namespace Math
{
	inline ll kpow(ll a,ll k)
	{
		ll ans = 1;
		for(;k;k >>= 1) {
			if(k & 1) (ans *= a) %= MOD;
			(a *= a) %= MOD;
		}
		return ans;
	}
};

namespace Union
{
	int fa[N],ss[N],tt[N];
	int get(int x)
	{
		if(fa[x] == x) return x;
		return fa[x] = get(fa[x]);
	}
};

namespace IO
{
	inline int read()
	{
		int s = 0,f = 1;char ch; 
		while(!isdigit(ch = getchar())) if(ch == '-') f = -1;
		while(isdigit(ch)) s = s * 10 + ch - '0',ch  = getchar();
		return s * f;
	}
};

using namespace Graph;
using namespace Math;
using namespace Union;
using namespace IO;

signed main()
{
	freopen("sakura.in","r",stdin);
	freopen("sakura.out","w",stdout);
	n = read(),m = read(),p = read();
	for(int i = 1,u,v,w;i <= m;i++) {
		u = read(),v = read(),w = read();
		add(u,v,w);
		e[i] = {u,v,w};
	}

	srand(unsigned(time(0)));
	root = rand() % n + 1;
	dfs(root,0);
	std::sort(e + 1,e + 1 + m,[](Edge x,Edge y) {return x.z > y.z;});
	for(int i = 1;i <= n;i++) {
		ss[i] = kpow(p,(i - 1) * n);
		tt[i] = kpow(p,i);
		fa[i] = i;
	}
	for(int i = 1;i < n;i++) {
		register int fx = get(e[i].x),fy = get(e[i].y);
		(ans += (1ll * e[i].z * ((ss[fx] * tt[fy] % MOD +
			tt[fx] * ss[fy] % MOD) % MOD) % MOD)) %= MOD;
		(ss[fx] += ss[fy]) %= MOD,(tt[fx] += tt[fy]) %= MOD;
		fa[fy] = fx;
	}
	printf("%lld",ans);
	exit(0);
}
```



