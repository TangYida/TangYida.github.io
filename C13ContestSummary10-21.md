### 10-21 考试总结
这一次是考试是国集的WAERRY出的。~~根本不会做~~题目出的很好。

题面：
> [time](https://tangyida.github.io/docs/time.pdf)

> [cover](https://tangyida.github.io/docs/cover.pdf)

> [game](https://tangyida.github.io/docs/game.pdf)

官方题解

> [solution](https://tangyida.github.io/docs/solution.pdf)

### time
号称是本次考试中最简单的题目。类似于IOI2019鞋盒的思路（jarigogun告诉我的），本道题的贪心方法是往序列两边**移动**（solution里面有详细的讲解）。其实，在实现的过程中有更加巧妙的方法：考虑对于每一个点，分别记录它左边、右边比他大的点数（这个过程可以用bit在$O(nlogn)$的时间内实现），取两者的最小值，答案是所有点之和。可以这样理解：为了让整个序列成为一个山峰，每一个点必定要跨过比他大的点。我们分别计算没一个点对答案的贡献，可以达到不重不漏。
代码：
```cpp
#include<bits/stdc++.h>
const int N = 1e5 + 3;
const int oo = 0x3f3f3f3f;

#define int long long

using value_type = long long;

inline int read()
{
	int s = 0,f = 1; char ch;
	while(!isdigit(ch = getchar())) if(ch == '-') f = -1;
	while(isdigit(ch)) s = s * 10 + ch - '0',ch = getchar();
	return s * f;
}

int n,w[N],max;

struct Bit
{
	int c[N];

	inline int lowbit(int x)  {return x & (-x);}

	inline void add(int x,int v)
	{
		for(;x <= max;x += lowbit(x)) c[x] += v;
	}

	inline int query(int x)
	{
		value_type ret = 0;
		for(;x;x -= lowbit(x)) ret += c[x];
		return ret;
	}
} bit1,bit0;

int les0[N],les1[N];

signed main()
{
	freopen("time.in","r",stdin);
	freopen("time.out","w",stdout);
	n = read();
	for(int i = 1;i <= n;i++) std::cin >> w[i],max = std::max(max,w[i]);
	value_type sum{0};
	for(int i = 1;i <= n;i++)
		les0[i] = i - bit0.query(w[i]) - 1,bit0.add(w[i],1);
	for(int i = n;i >= 1;i--)
		les1[i] = n - i - bit1.query(w[i]),bit1.add(w[i],1);
	for(int i = 1;i <= n;i++) sum += std::min(les0[i],les1[i]);
	std::cout << sum;
	return 0;
}
```
### cover
**由包含关系联系到建树是一种常用套路。**同时，惊奇的发现，使用dp值差分+set+启发式合并进行优化可以让暴力直接跑出正解的复杂度！（仔细分析一波，发现单次合并是$\log n$的,而set的遍历消耗时间很少）。不得不说，C++实现者们真是造福人类。
```cpp
#include<bits/stdc++.h>
#include<set>
#include<stack>

const int N = 3e5 + 3;
using ll = long long;

namespace IO
{
	inline ll read()
	{
		ll s = 0,f = 1; char ch;
		while(!isdigit(ch = getchar())) if(ch == '-') f = -1;
		while(isdigit(ch)) s = s * 10 + ch - '0',ch = getchar();
		return s * f;
	}
};

using namespace IO;

struct Segment {int l,r; ll a;} seg[N];

int n,k;
int ver[N << 1],head[N],nxt[N << 1],tot = 1;
inline void add(int x,int y)
{
	ver[++tot] = y,nxt[tot] = head[x],head[x] = tot;
}

std::multiset<ll,std::greater<ll>> set[N];
std::stack<int> st;

inline void create()
{
        /*使用单调栈优化建树*/
	seg[k + 1] = {1,n,0};
	std::sort(seg + 1,seg + 2 + k,[](Segment x,Segment y) -> bool{
		if(x.l != y.l) return x.l < y.l;
		return x.r > y.r;
	}); /*FIXME*/
	st.push(1);
	for(int i = 2;i <= k + 1;i++) {
		while(st.size() && seg[i].r > seg[st.top()].r) st.pop();
		if(st.size())
			add(st.top(),i);
		st.push(i);
	}
}

inline void merge(int x,int y)
{
	/*复杂度是对的!*/
	if(set[y].size() > set[x].size()) std::swap(set[x],set[y]);
	for(auto i = set[x].begin(),j = set[y].begin();
			i != set[x].end() && j != set[y].end(); j++,i++) {
		const_cast<ll&>(*i) += *j;/*用mutable单元素结构体也可以*/
	}
}

void solve(int x)
{
	for(int i = head[x];i;i = nxt[i]) {
		solve(ver[i]);
		/*启发式合并的过程*/
		merge(x,ver[i]);
	}
	set[x].insert(seg[x].a);
}

int main()
{
	freopen("cover.in","r",stdin);
	freopen("cover.out","w",stdout);
	n = read(),k = read();
	for(int i = 1;i <= k;i++)
		seg[i].l = read(),seg[i].r = read(),seg[i].a = read();

	create(); /*FIXME*/

	solve(1);

	ll sum{0}; int cnt = 0;
	for(auto i : set[1]) {
		sum += i;
		if(++cnt > k) break;
		printf("%lld ",sum);
	}
	for(int i = cnt + 1;i <= k;i++) printf("%lld ",sum);

	exit(0);
}
```

### game
不得不说，这无愧于本次考试最难的题目。提供一下考场上面残缺的思路：先贪心求出最有答案，在根据这个答案计算出最大字典序排列。关键是后面一步怎么做。题解给我们提供这样一种思路：因为要求字典序最大，所以我们可以从高位向低位贪心。而且每一位的取值满足单调性（即大值满足要求，小值也必定满足要求）。这个时候我们可以二分。可是怎么动态计算配对个数呢？真想不到，可以使用线段树动态维护（思路真是奇怪）。与其说是线段树，更不如说是‘支持动态修改的分治’（我只能这样形容了）。当然，这里也用到了set。
代码：
```cpp
#include<bits/stdc++.h>
#include<set>
using RbTree = std::multiset<int>;

inline int read()
{
	int s = 0,f = 1; char ch;
	while(!isdigit(ch = getchar())) if(ch == '-') f = -1;
	while(isdigit(ch)) s = s * 10 + ch - '0',ch = getchar();
	return s * f;
}

const int N = 1e5 + 3;

int n,b[N],a[N],n0;

struct SegmentTree
{
	int leftA[N << 2],leftB[N << 2],sum[N << 2];

	inline void pushup(int idx)
	{
		auto nw = std::min(leftB[idx << 1],leftA[idx << 1 | 1]);
		sum[idx] = sum[idx << 1] + sum[idx  << 1 | 1] +  nw;
		leftA[idx] = leftA[idx << 1] + leftA[idx << 1 | 1] - nw;
		leftB[idx] = leftB[idx << 1] + leftB[idx << 1 | 1] - nw;
	}

	inline auto query() -> decltype(sum[1]) {return sum[1];}

	void change(int idx,int l,int r,int x,int y,int to)
	{
		if(l == r) return leftA[idx] += x,leftB[idx] += y,void();
		int mid = (l + r) >> 1;
		if(to <= mid) change(idx << 1,l,mid,x,y,to);
		else change(idx << 1 | 1,mid + 1,r,x,y,to);
		pushup(idx);
	}
};

RbTree set;
SegmentTree tr;

/*难*/

int main()
{
	freopen("game.in","r",stdin);
	freopen("game.out","w",stdout);

	n = read();
	for(int i = 1;i <= n;i++)
		b[i] = read(),tr.change(1,1,n,0,1,b[i]);
	for(int i = 1;i <= n;i++)
		a[i] = read(),tr.change(1,1,n,1,0,a[i]),set.insert(a[i]);
	for(int i = 1;i <= n;i++) n0 = std::max(n0,std::max(a[i],b[i]));

	auto src = tr.query();
	for(int i = 1;i <= n;i++) /*greedy one by one*/ {
		tr.change(1,1,n0,0,-1,b[i]); /*消去待配对b的贡献*/
		/*尝试在此处填能产生贡献的数值*/
		int left = b[i] + 1,right = *set.rbegin(),mid,ans{-1};
		while(left <= right) {
			mid = (left + right) >> 1;
			tr.change(1,1,n0,-1,0,mid);

			if(tr.query() + 1 == src) left = mid + 1,ans = mid;
			else  right = mid - 1;

			tr.change(1,1,n0,1,0,mid); /*撤销*/
		}

		/*讨论配对是否成功*/
		if(ans != -1) { /*配对成功*/
			src--;
			tr.change(1,1,n0,-1,0,ans);
			set.erase(set.lower_bound(ans));
			printf("%d ",ans);
		} else { /*配对失败*/
			left = 1,right = b[i],ans = -1;
			while(left <= right) {
				mid = (left +  right) >> 1;
				tr.change(1,1,n0,-1,0,mid);
				if(tr.query() == src) left = mid + 1,ans = mid;
				else right = mid - 1;
				tr.change(1,1,n0,1,0,mid);
			}
			tr.change(1,1,n0,-1,0,ans);
			set.erase(set.lower_bound(ans));
			printf("%d ",ans);
		}
	}

	exit(0);
}
```
