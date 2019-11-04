## 初学莫队
> skydogli出了一道回滚莫队的题目;今天CZY也赶时髦，索性在考试中丢给你一个莫队全家桶。不能在爆零下去了！所以我开始学习莫队。本文持续更新。

### Problem set
#### 小Z的袜子
是一道好题目。它向我们介绍了一种全新的算法。莫队实际上是对普通离线操作的优化。复杂度证明貌似很必要，在乱搞的时候非常有用。但是我不会。
#### 小B的询问
我的第二道莫队题目。这个时候，我才发现，一般适合使用莫队的题目大多有如下套路：
* 几乎没有修改（或者修改不影响询问）。
* 询问与询问之间的增、减转移代价很小。如询问值的分布情况等。
关于它的优化，我真的不会。（懒）~~手动调参算不算~~
#### 异或序列[CQOI2018]
题目形式非常之莫队。但是，仔细一看，这道题目有一个很麻烦的地方：它需要快速统计区间异或和。仔细思考一下（仔细看看题解），发现异或有一个很好的性质：我们设$sum(x) = \oplus_{i=1}^x w_i$，那么$\oplus_{i=x}^y = sum(y) \oplus sum(x - 1)$。尝试转换题目形式（关键!）。直接对$sum(x)$操作。

#### 小清新人渣的本愿
这个题面着实不敢恭维。题目也这么毒瘤。事实上是，它很套路，只不过要记得加bitset优化。

#### 歴史の研究(日文！)
第一次做回滚莫队的题目。比较困难。我们之前所接触的莫队题目均可以在很快的时间内实现增加、删减。但是，要维护区间内某个东西的最大值，这就非常难了。所以：

> 我们祭出一个黑科技：回滚莫队。
>     >                             -skydogli

我们每一次进行扩张之后，都傻傻的将指针移动到这个块的右端点后的第一个点。因为我们可以保证右端点递增。所以，之后的操作都会‘增加’。所以我们成功的将原有问题转换成为了更简单的版本。可以证明，这个复杂度还是$O(n\sqrt n)$的（只要块的大小为$\sqrt n$）。看看代码，可以理解的更快：

```cpp
#include<bits/stdc++.h>

const int N = 1e5 + 3,M = 1e5 + 3,B = 1e3 + 3;
using value_type = long long;
struct Query
{
	int l,r,id;
};

Query q[M];
int pos[N],left[B],right[B],t; 		/*for block*/
int buk[N],w[N],ref[N];value_type out[N],ans; 	/*for mos algorithm*/
int n,m;

inline int read()
{
	int s = 0,f = 1; char ch;
	while(!isdigit(ch = getchar())) if(ch == '-') f = -1;
	while(isdigit(ch)) s = s * 10 + ch - '0',ch = getchar();
	return s * f;
}

inline void discre() /*离散化*/
{
	memcpy(ref,w,sizeof w); std::sort(ref + 1,ref + 1  + n);
	int n0 = std::unique(ref + 1,ref + 1 + n) - ref  - 1;
	for(int i = 1;i <= n;i++)
		w[i] = std::lower_bound(ref + 1,ref + 1 + n0,w[i]) - ref;
}

inline void prepare() /*分块预处理*/
{
	t = sqrt(n);
	for(int i = 1;i <= t;i++)
		left[i] = right[i - 1] + 1,right[i] = left[i] + t - 1;
	if(right[t] < n) left[t + 1] = right[t] + 1,right[++t] = n;
	for(int i = 1;i <= t;i++)
		for(int j = left[i];j <= right[i];j++) pos[j] = i;
}

inline void add(int pos)
{
	buk[w[pos]]++;
	ans = std::max(ans,1ll * buk[w[pos]] * ref[w[pos]]);
}

inline void del(int pos)
{
	buk[w[pos]]--;
}

inline value_type bf(int idx) /*for brute force*/
/*分块：局部朴素*/
{
	static int tmpCnt[N];
	static value_type ret;
	ret = 0;
	memset(tmpCnt,0,sizeof tmpCnt);
	for(int i = q[idx].l;i <= q[idx].r;i++) {
		tmpCnt[w[i]]++;
		ret = std::max(ret,1ll * tmpCnt[w[i]] * ref[w[i]]);
	}
	return ret;
}

/*莫队主体*/
inline void mos()
{
	prepare();
	int cl,cr,pl;
	std::sort(q + 1,q + 1 + m,[](Query x,Query y) -> bool{
		if(pos[x.l] == pos[y.l]) return x.r < y.r;
		return pos[x.l] < pos[y.l];
	});
	for(int i = 1;i <= m;i++) {
		if(pos[q[i].l] != pos[q[i - 1].l]) /*edge*/ {
			pl = left[pos[q[i].l] + 1];
			memset(buk,0,sizeof buk);
			cl = pl,cr = pl - 1; /*in order to adapt to the change*/
			ans = 0;
		}

		if(pos[q[i].l] == pos[q[i].r]) /*special judge*/
			out[q[i].id] = bf(i);
		else {
			while(cr < q[i].r) add(++cr);
			/*可以保证右端点不会回滚*/
			auto tmp = ans;
			while(cl > q[i].l) add(--cl);
			out[q[i].id] = ans;
			while(cl < pl) del(cl++);/*回滚*/
			ans = tmp; 		/*还原现场*/
		}
	}
}

int main()
{
#ifdef CLANG
	freopen("hisstudy.in","r",stdin);
	freopen("hisstudy.out","w",stdout);
#endif
	n = read(),m = read();
	for(int i = 1;i <= n;i++)
		w[i] = read();
	discre();
	for(int i = 1;i <= m;i++) {
		q[i].l = read(),q[i].r = read();
		q[i].id = i;
	}

	mos();

	for(int i = 1;i <= m;i++)
		printf("%lld\n",out[i]);
	exit(0);
}

```
