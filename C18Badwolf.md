### Halloween's Contest
题面描述：

```
恶狼

1.1 题目
Every moment of your life laid out around you,
Like a city.

1.2 题目
Bad Wolf 无处不在，但它的出现似乎总是遵从一定的规律。
小 X 用于探测 Bad Wolf 的设备是一个 N × N 的矩阵，其中每一个元素都是一个
探测方块。当第 i 行，第 j 列的探测方块探测到 Bad Wolf 时，它会发出一个单项式
ai,j xei,j 作为信号。Bad Wolf 出现时，小 X 得到的总信号就是发出信号的探测方块发出
的单项式的
。
在 Bad Wolf 出现时，总会有
N 个探测方块探测到它。研究发现，如果认为
具有 共 的探测方块是相邻的，这些探测方块一定会构成一个连通的区域，并且，这
个连通区域一定会包含第一行、以及第一列的
一个探测方块。
由于 Bad Wolf 的行踪飘忽不定，小 X 希望对于 Bad Wolf 所有可能的出现位置，
求出自己得到的总信号之和。这将是一个系数巨大的多项式，因此小 X 只需要你求出
x0 , x1 , . . . , xM 前的系数对 109 + 7 取模的结果就可以了。

1.3 输入 式
从文件 badwolf.in 中读取数据。
第一行两个整数 N, M ，分别表示探测矩阵的大小，以及要求的多项式的次数。
接下来 N 行，每行 N 个二元组 (ai,j , ei,j ) ，表示一个探测方块发出的信号。

1.4 输出

式

输出到文件 badwolf.out 中。
输出一行 M + 1 个整数 Ansi ，表示 x0 , x1 , . . . , xM 的系数对 109 + 7 取模的结果。

1.5 样例 1 输入
3 3
(1,1) (2,1) (5,0)
(1,0) (3,1) (0,0)
(1,0) (0,0) (0,0)

2

1.6 样例 1 输出
0 1 21 6

1.7 样例 1
Bad Wolf 共有 6 种可能出现的位置：
(1)、出现在 (1, 1), (1, 2), (1, 3) 处：得到的总信号为 10x2
(2)、出现在 (1, 1), (2, 1), (3, 1) 处：得到的总信号为 x
(3)、出现在 (1, 1), (1, 2), (2, 2) 处：得到的总信号为 6x3
(4)、出现在 (1, 1), (2, 1), (2, 2) 处：得到的总信号为 3x2
(5)、出现在 (1, 1), (1, 2), (2, 1) 处：得到的总信号为 2x2
(6)、出现在 (1, 2), (2, 1), (2, 2) 处：得到的总信号为 6x2
得到的总信号之和为 x + 21x2 + 6x3 。
```


### 题解
github的服务器真的是太慢了。想了一个发子，把PDF转换成html。这样子也许会更快。（给github的服务器上香。）。

抛开那个不谈。本篇博客确实是第一篇使用html描述题面的博客。值得庆祝（笑）。

回观此题。本机房的大佬们第一眼想到的是轮廓DP。然而我不会写。但是仔细想想，这道题目貌似并不适合使用DP，因为题面给的限制实在是太多了（最棘手的是必须有图案触及到第一行和第一列）。

我们发挥人类的聪明才智，发现这个限制貌似不能发挥什么作用。我们只需要求出这个联通图案有多少中不同的形态，（顺便把对应的多项式求出来），将每一个图案往左上角卡一卡就满足限制了。

接下来，我们迫不得已使用搜索。这个搜索，不得不说，难度对我太不友好了。首先要解决的问题是，怎么去重。如果用一些愚蠢的办法，那么他的复杂度是极其错误的。考虑如何在搜索的过程中不产生重复的情况。有一种做法，是人为 给每一个格子规定一个时间戳，（大多数情况是其BFS序），同时每一次转移只能够从小的往大的转移（这样，就可以避免重复情况了，不信你手mo一下）。具体的，我们将待扩展的节点按照时间顺序加入到一个队列里面，每一次选取其中一个大于当前时间戳的点进行扩展，同时注意维护这个队列。（用huhao的话说，这是dfs of bfs）。为了优化复杂度，我们只从网格的左下角开始dfs。

当然，只从左下角开始构图可能存在这种情况：

```
________
|____   |
     |  |
     |__|
```

这种情况不会被我们考虑到。所以我们人为的把网格拉长一倍（不得不说，很多东西确实是乱搞出来的，只要你敢想）。但是又存在一种情况：

```
______________
|1           |
|1___________|
|2           |
|2___________|
```

11和22这两种情况是一样的！为了解决这个问题，我们大胆乱搞，将图形的上半部分的第一列标记为不可选。神奇的发现，这样就可以不重不漏的统计了。

代码：
```cpp
#include<cstdio>
#include<vector>
#include<cctype>
#include<algorithm>

inline int read()
{
	int s{0},f{1}; char ch;
	while(!isdigit(ch = getchar())) if(ch == '-') f = -1;
	while(isdigit(ch)) s = s * 10 + ch - '0',ch = getchar();
	return s * f;
}

typedef std::pair<int,int> pp;
typedef long long ll;
const int N = 15 + 5,M = 1e3 + 3,LIM =  1e6 + 3;
const ll MOD = 1e9 + 7;

int ans[M],n,m;
int delta[4][2] = {{0,1},{0,-1},{1,0},{-1,0}};
pp a[N << 1][N]; /*题目中的a、e*/
pp buf[LIM]; /*经过重新标号之后可以到达的位置。但是这个队列的尾指针是不断变换的。*/
pp cur[N << 1]; /*表示当前图案的点集*/
bool aval[N << 1][N]; /*可以扩展的位置*/

/*now: 当前点的时间戳，tail： 队列的尾部*/
inline bool isNotLegit(int x,int y)
{
	return x < 1 || y < 1 || x > 2 * n || y > n; /*FIXME*/
}

inline  pp operator*(pp x,pp y)
{return {1ll * x.first * y.first % MOD,(1ll * x.second + y.second) % MOD};}

inline void mod(int& x)
{
	if(x >= MOD) x -= MOD;
}


inline void getAns()
{
	int minX{N},minY{N};
	for(int i = 1;i <= n;i++) {
		minX = std::min(minX,cur[i].first);
		minY = std::min(minY,cur[i].second);
	}
	pp res{1,0};
	for(int i = 1;i <= n;i++) {
		res = res * a[cur[i].first - minX + 1][cur[i].second - minY + 1];
	}
	mod(ans[res.second] += res.first);
}

void dfs(int now,int tail,int step)
{ 
#define DX (cur[step].first + delta[j][0])
#define DY (cur[step].second + delta[j][1])
	if(step == n + 1) {
		/*
		for(int i = 1;i <= n;i++)
			printf("%d %d\n",cur[i].first,cur[i].second);
			*/
		return getAns(),void();
	}
	for(register int i = now + 1;i <= tail;i++) {
		cur[step] = buf[i];
		/*更新buf*/
		register int tmp = tail; ll rec{0};
		for(int j = 0;j < 4;j++) {
			if(!aval[DX][DY] || isNotLegit(DX,DY)) continue;
			buf[++tmp] = {DX,DY},aval[DX][DY] = 0;
			rec |= 1 << (j);
		}
		dfs(i,tmp,step + 1);
		/*还原现场*/
		for(register int j = 0;j < 4;j++) if(rec & (1 << j))
			aval[DX][DY] = 1;
	}
#undef DX
#undef DY
}

signed main()
{ 
	freopen("badwolf.in","r",stdin);
	freopen("badwolf.out","w",stdout);
	n = read(),m = read();
	for(int i = 1;i <= n;i++) for(int j = 1;j <= n;j++) {
		a[i][j].first = read();
		a[i][j].second = read(); /*毒瘤输入*/
	}
	for(int i = 1;i <= 2 * n;i++) for(int j = 1;j <= n;j++)
		if(j > 1 || i > n) aval[i][j] = 1;

	buf[1] = {n,1};
	dfs(0,1,1);

	for(int i = 0;i <= m;i++) printf("%d ",ans[i]);

	return 0;
}
```

我好强，快来[膜拜](https://tomtomorz.github.io)我吧！
