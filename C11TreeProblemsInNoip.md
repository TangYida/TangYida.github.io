## NOIp的两道树上问题：赛道修建、疫情控制

### 赛道修建

#### 题面描述

[luogu链接](https://www.luogu.org/problem/P5021)

#### 题解

这是我第一次做这种比较难的树上问题（有没有发现NOIp很喜欢考这种图论题！），深深的意识到：做这种题目需要明白自己的每一步需要干什么，不然会疯的。

* "使得修建的 m 条赛道中长度最小的赛道长度最大" 。很套路地，我们意识到这道题目需要用二分答案做。这需要我们思考一个问题，使用**二分答案**有什么优越性？我太菜了，不知道怎么描述，只能肤浅的说：最小中最大等问题，在求部分最优解的同时好还需要考虑到其他子问题，此时如果不把求解转换为判定，我们还应该怎么做！求解转判定给我们提供了一个“可爱”的限制，让我们可以放肆贪心。（笑）

* 我们还需要意识到：$m$这个限制很不好处理。所以我们总结一条判定法则：二分出来的最长链长度$mid$符合条件，当且仅当小于等于$mid$的链的个数$\geq m$。（这一步需要反复理解！）

* 接下来我们考虑用树上DP来尽量最大化长度$\leq mid$的链的个数（你看，问题被我们转换成了一个简单的最优化问题）。假设我们已经转移到了节点$v$，我们现在怎么走下去？一个方法是，把每一个每一棵子树分成若干条链，留下一条链向上传，其他的链合并。这是一个递归的子问题。设$f[i]$表示以$i$根的子树可以向上贡献多长的链。对于节点$u$，$i\in son(u)$，我们贪心的合并尽量多的长度小于等于$mid$的链，剩下的链中取一条最长的作为$f[u]$。可以证明这种贪心方式可以最大化链的个数。

  看看代码吧：（第一次写这种题目感觉实现比较难）

  ```cpp
  #include<bits/stdc++.h>
  
  const int N  = 5e4 + 3;
  
  inline int read()
  {
  	int s = 0,f = 1; char ch;
  	while(!isdigit(ch = getchar())) if(ch == '-') f = -1;
  	while(isdigit(ch)) s  = s * 10 + ch - '0',ch = getchar();
  	return s * f;
  }
  
  int ver[N << 1],nxt[N << 1],edge[N << 1],head[N],tot = 1;
  inline void add(int x,int y,int z)
  {
  	ver[++tot] = y,edge[tot] = z,nxt[tot] = head[x],head[x] = tot;
  	ver[++tot] = x,edge[tot] = z,nxt[tot] = head[y],head[y] = tot;
  }
  
  int n,m,left = 0x3f3f3f3f,right;
  int dp[N],sum = 0,buk[N],vec[N],tail;
  
  void dfs(int x,int fa,const int min)
  {
  	for(int i = head[x];i;i = nxt[i]) if(ver[i] != fa)
  		dfs(ver[i],x,min);
  
  	tail = 0;
  	/*IMPORTANT*/
  	for(int i = head[x];i;i = nxt[i]) if(ver[i] != fa)
  		vec[++tail] = dp[ver[i]] + edge[i];
  
      //贪心的合并：将子树贡献上来的链按长度排序，然后使用二分查找找到每一条链可以与之合并的另一条链。
  	std::sort(vec + 1,vec + 1 + tail);
  
  	for(;tail >= 1 && vec[tail] >= min;tail--) sum++;
  
  	for(int i = 1;i <= tail;i++) {
  		if(buk[i] != x) {
  			int ptr = std::lower_bound(vec + i + 1,vec + 1 + tail,
  				min - vec[i]) - vec;
  			while(buk[ptr] == x && ptr <= tail)
  				ptr++;
  			if(buk[ptr] != x && ptr <= tail) {
  				buk[i] = buk[ptr] = x;
  				++sum;
  			}
  		}
  	}
  	for(int i = tail;i >= 1;i--)
  		if(buk[i] != x) {
  			dp[x] = vec[i];
  			break;
  		}
  	return;
  }
  
  inline bool check(int min)
  {
  	memset(dp,0,sizeof(int) * (n + 1));
  	memset(buk,0,sizeof(int) * (n + 1));
  	sum = 0;
  	dfs(1,0,min);
  	return sum >= m;
  }
  
  signed main()
  {
  
  	n = read(),m = read();
  	for(int i = 1,u,v,w;i < n;i++) {
  		u = read(),v = read(),w = read();
  		add(u,v,w);
  
  		left = std::min(left,w);
  		right += w;
  	}
  	int ans;
  	while(left <= right) {
  		int mid = (left + right) >> 1;
  		if(check(mid)) ans = mid,left = mid + 1;
  		else right = mid - 1;
  	}
  	std::cout << ans;
  	exit(0);
  }
  
  ```

  

### 疫情控制
#### 题面描述
[luogu链接](https://www.luogu.org/problem/P1084)
#### 题解
* 关键语句：请问最少需要多少个小时才能控制疫情。注意：不同的军队可以同时移动。稍微学过语文的同学一看就知道，这是一道题目需要二分答案。稍微看看代码：
* 我们二分最长时间。贪心的想，在长度$mid$的限制下，每一支军队尽量地往深度浅的地方跳显然是最优的（因为可以覆盖更多的节点）。我们用倍增优化这个向上跳的过程。每个军队跳完之后，我们标记相应的节点已被覆盖。
* 但是题目远不止这么简单。一直军队若是在限制内已经跳到了根节点的子节点，同时他依然有闲情逸志绕过跟节点覆盖还没有被覆盖的跟节点的子节点。我们取消对这些军队的标记，并且把他们额外保存下来（用一个手写的队列貌似非常方便）。保存时要注意同时记录下他们额外可以走的路程与本来可以覆盖的节点（在不越过根节点的情况下）。接下来有一个非常巧妙（但同时也很自然）的操作，将那些有闲情逸志的军队以剩余路程为第一关键字**从小到大**排序。并且记录下还没有被覆盖的跟的子节点与他们和根节点的距离，并按照距离从小到大排序。我们从头到尾扫描这些军队，按照如下方法贪心：

     1. 如果当前军队原来管辖的节点没有被覆盖，那么这支军队选择不越过根节点，而是守在原来的节点上。因为我们是按照剩余路程进行排序的，所以可以证明这种贪心一定最优。
     2. 否则，我们从未被覆盖的节点中选择*最合适*的与该军队配对。
这一段实现看代码。
* 进行了以上操作之后，扫一遍，若还存在没有被覆盖的跟的子节点，则判定这个$mid$不合法。

看看代码吧：
```c
#prag\
ma GCC optimize("Ofast")
#include<bits/stdc++.h>

const int N = 5e4 + 3;

inline int read()
{
	int s = 0,f = 1; char ch;
	while(!isdigit(ch = getchar())) if(ch == '-') f = -1;
	while(isdigit(ch)) s = s * 10 + ch - '0',ch = getchar();
	return s * f;
}

typedef std::pair<int,int> pzk;

std::queue<int> q;
pzk stora0[N],stora1[N]; /*两个队列*/

int ver[N << 1],nxt[N << 1],head[N],edge[N << 1],tot = 0;

inline void add(int x,int y,int z)
{
	ver[++tot] = y,edge[tot] = z,nxt[tot] = head[x],head[x] = tot;
}

int dis[N][20],t,fa[N][20],tag[N],tail0,tail1,n,m,
    cities[N],ans{-1},left{INT_MAX},right,mid;

/*倍增预处理*/
inline void prepare()
{
	t = log2(n) + 1;
	q.push(1);
	while(q.size()) {
		int x = q.front(); q.pop();
		for(int i = head[x];i;i = nxt[i]) {
			if(ver[i] == 1 || dis[ver[i]][0]) continue;
			fa[ver[i]][0] = x,dis[ver[i]][0] = edge[i];
			for(int j = 1;j <= t;j++) {
				fa[ver[i]][j] = fa[fa[ver[i]][j - 1]][j - 1];
				dis[ver[i]][j] = dis[fa[ver[i]][j - 1]][j - 1] +
					dis[ver[i]][j - 1];
			}
			q.push(ver[i]);
		}
	}
}

/*倍增向上跳*/
inline void jump(int idx,int cons)
{
	/*FIXME*/
	for(int i = t;i >= 0;i--)
		if(fa[idx][i] > 1 && cons - dis[idx][i] >= 0) {
			cons -= dis[idx][i];
			idx = fa[idx][i];
		}
	if(cons - dis[idx][0] > 0 && fa[idx][0] == 1)
		stora0[++tail0] = {cons - dis[idx][0],idx};
	else tag[idx] = 1;
}

/*进行初步染色之后，上传标记到根节点的子节点，以便后面的判定。*/
void paint(int x,int fa)
{
	if(tag[x]) return;

	bool flag = 1,has = 0;
	for(int i = head[x];i;i = nxt[i]) {
		if(ver[i] == fa) continue;
		paint(ver[i],x);
		has = 1,flag &= tag[ver[i]];
	}
	tag[x] = flag & has;
}

/*没什么好说的*/
inline bool check(int cons)
{
	for(int i = 1;i <= n;i++) tag[i] = 0;
	tail0 = 0,tail1 = 0;
	for(int i = 1;i <= m;i++) jump(cities[i],cons);

	paint(1,0);
	for(int i = head[1];i;i = nxt[i]) if(!tag[ver[i]])
		stora1[++tail1] = {edge[i],ver[i]};

	std::sort(stora0 + 1,stora0 + 1 + tail0);
	std::sort(stora1 + 1,stora1 + 1 + tail1);

	int ptr = 1;
	for(int i = 1;i <= tail0;i++) {
		if(!tag[stora0[i].second])
			tag[stora0[i].second] = 1;
		else if(ptr <= tail1 && stora0[i].first >= stora1[ptr].first)
			tag[stora1[ptr].second] = 1; /*FIXME*/
		while(ptr <= tail1 && tag[stora1[ptr].second])
			ptr++;
	}
	return ptr > tail1;
}

inline void chkMin(int& x,int y)  {x = std::min(x,y);}

int main()
{
#ifndef ONLINE_JUDGE
	freopen("army.in","r",stdin);
	freopen("army.out","w",stdout);
#endif
	n = read();
	for(int i = 1,u,v,w;i < n;i++) {
		u = read(),v = read(),w = read();
		add(u,v,w),add(v,u,w);

		chkMin(left,w),right += w;
	}

	m = read();
	for(int i = 1;i <= m;i++) *(cities + i) = read();

	prepare();

	while(left <= right) {
		mid = (left + right) >> 1;
		if(check(mid)) right = mid - 1,ans = mid;
		else left = mid + 1;
	}

	printf("%d",ans);

	exit(0);
}

```

