## 小w的图

### 题面
[pdf](http://lk.yali.edu.cn/problem/53/graph.pdf)

### 题解
这道题目的模型很简单，即求一条路径，使得路径上的所有边权与最大。首先要明确的一点，我们不要用最短路算法。同时，发掘与运算的性质：当且仅当一条路径上的所有边权同一位是1,该位才能计入贡献。所以我们用**贪心**+**并查集**。代码：
```cpp
#include<bits/stdc++.h>
using ll = unsigned long long;
const int N = 1e5 + 3,M = 5e5 + 3;
int fa[N],depth[N],n,m,e;

struct Edge
{
	int x,y;
	ll z;
	inline bool operator<(const Edge& b) const {return this->z > b.z;}
};
using iter = std::vector<Edge>::iterator;
std::vector<Edge> a,b;

inline void merge(int x,int y)
{
	if(depth[x] > depth[y]) std::swap(x,y);
	fa[x] = y,depth[y] = std::max(depth[y],depth[x] + 1);
}

int get(int x)
{
	if(fa[x] == x) return x;
	return fa[x] = get(fa[x]);
}

template<typename T = int>
inline T read()
{
	T s = 0,f = 1; char ch;
	while(!isdigit(ch = getchar())) if(ch == '-') f = -1;
	while(isdigit(ch)) s = s * 10 + ch - '0',ch = getchar();
	return s * f;
}

int main()
{
	freopen("graph.in","r",stdin);
	freopen("graph.out","w",stdout);
	n = read(),m = read();
	int u,v; ll w;
	for(register int i = 1;i <= m;i++) {
		if(u > v) std::swap(u,v);
		u = read(),v = read(),w = read<ll>();
		e = std::max(e,(int)log2(w) + 1);
		a.push_back({u,v,w});
	}

	ll ans = 0;
	for(register ll i = e;i >= 1;i--) {
		for(register int j = 1;j <= n;j++) j[fa] = j,j[depth] = 1;
		b.clear();

		for(auto j = a.begin();j != a.end();j++) {
			if(((j->z) & (1ull << (i - 1)))) {
				b.push_back(*j);
				int fx = get(j->x),fy = get(j->y);
				if(fx != fy) merge(fx,fy);
			}
		}
		if(get(1) == get(n)) {
			ans |= (1ull << (i - 1));
			a.assign(b.begin(),b.end());
		}
	}
	printf("%lld",ans);
	exit(0);
}
```
